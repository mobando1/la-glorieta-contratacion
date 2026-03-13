import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { CANDIDATE_STATUSES } from "@/domain/types";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rf = session.restaurantFilter;

    const [
      statusCounts,
      scoreAgg,
      restaurantCounts,
      positionCounts,
      recentActivity,
      employeeCounts,
      hiredCandidates,
      reviewCandidates,
      redFlagEvals,
      poolStatusCounts,
      poolScoreAgg,
    ] = await Promise.all([
      // Pipeline counts by status
      prisma.candidate.groupBy({
        by: ["status"],
        _count: true,
        where: rf,
      }),
      // Average score
      prisma.aIEvaluation.aggregate({
        _avg: { totalScore: true },
        where: {
          evaluationType: "ONLINE",
          ...(session.isSuperAdmin ? {} : { candidate: rf }),
        },
      }),
      // By restaurant
      prisma.candidate.groupBy({
        by: ["restaurantId"],
        _count: true,
        where: rf,
      }),
      // By position
      prisma.candidate.groupBy({
        by: ["positionApplied"],
        _count: true,
        where: rf,
      }),
      // Recent activity
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      // Employee counts by onboarding status
      prisma.employee.groupBy({
        by: ["onboardingStatus"],
        _count: true,
        where: session.isSuperAdmin ? {} : rf,
      }),
      // Hired candidates for time-to-hire
      prisma.candidate.findMany({
        where: { status: "CONTRATADO", ...rf },
        select: {
          createdAt: true,
          decisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      // Pending reviews
      prisma.candidate.count({
        where: {
          status: "EVALUADO",
          evaluations: { some: { requiresHumanReview: true } },
          ...rf,
        },
      }),
      // Red flags - candidates not in terminal states with red flags
      prisma.aIEvaluation.findMany({
        where: {
          redFlags: { not: "[]" },
          candidate: {
            status: { notIn: ["CONTRATADO", "NO_CONTINUAR"] },
            ...rf,
          },
        },
        select: { candidateId: true },
      }),
      // Pool stats by employment status
      prisma.employee.groupBy({
        by: ["employmentStatus"],
        _count: true,
        where: session.isSuperAdmin ? {} : rf,
      }),
      // Pool avg scores
      prisma.employee.aggregate({
        _avg: { reliabilityScore: true, priorityScore: true },
        where: {
          employmentStatus: { in: ["ACTIVO", "DISPONIBLE"] },
          ...(session.isSuperAdmin ? {} : rf),
        },
      }),
    ]);

    // Build pipeline
    const pipeline: Record<string, number> = {};
    for (const s of CANDIDATE_STATUSES) {
      pipeline[s] = 0;
    }
    for (const row of statusCounts) {
      pipeline[row.status] = row._count;
    }

    const totalCandidates = Object.values(pipeline).reduce((a, b) => a + b, 0);
    const contratados = pipeline["CONTRATADO"] || 0;
    const conversionRate = totalCandidates > 0 ? Math.round((contratados / totalCandidates) * 100) : 0;

    // Avg time to hire (in days)
    let avgTimeToHire = 0;
    if (hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((sum, c) => {
        const decision = c.decisions[0];
        if (!decision) return sum;
        const days = (decision.createdAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    // Unique red flag candidate count
    const redFlagCount = new Set(redFlagEvals.map((e) => e.candidateId)).size;

    // Restaurant names lookup
    const restaurantIds = restaurantCounts
      .map((r) => r.restaurantId)
      .filter((id): id is string => id !== null);
    const restaurants = restaurantIds.length > 0
      ? await prisma.restaurant.findMany({
          where: { id: { in: restaurantIds } },
          select: { id: true, name: true },
        })
      : [];
    const restaurantMap = new Map(restaurants.map((r) => [r.id, r.name]));

    const byRestaurant = restaurantCounts
      .filter((r) => r.restaurantId !== null)
      .map((r) => ({
        id: r.restaurantId!,
        name: restaurantMap.get(r.restaurantId!) || "Sin restaurante",
        count: r._count,
      }));

    const byPosition = positionCounts.map((p) => ({
      position: p.positionApplied,
      count: p._count,
    }));

    // Employee totals
    let employeesTotal = 0;
    let onboardingPending = 0;
    let onboardingComplete = 0;
    for (const row of employeeCounts) {
      employeesTotal += row._count;
      if (row.onboardingStatus === "COMPLETADO") onboardingComplete = row._count;
      else onboardingPending += row._count;
    }

    // Pool stats
    const pool = {
      activos: 0,
      disponibles: 0,
      noDisponibles: 0,
      noRecontratar: 0,
      avgReliability: Math.round(poolScoreAgg._avg.reliabilityScore ?? 0),
      avgPriority: Math.round(poolScoreAgg._avg.priorityScore ?? 0),
    };
    for (const row of poolStatusCounts) {
      if (row.employmentStatus === "ACTIVO") pool.activos = row._count;
      else if (row.employmentStatus === "DISPONIBLE") pool.disponibles = row._count;
      else if (row.employmentStatus === "NO_DISPONIBLE") pool.noDisponibles = row._count;
      else if (row.employmentStatus === "NO_RECONTRATAR") pool.noRecontratar = row._count;
    }

    // Resolve performedBy to admin emails
    const performerIds = [...new Set(recentActivity.map((a) => a.performedBy).filter((id): id is string => id !== null))];
    const performers = performerIds.length > 0
      ? await prisma.adminUser.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, email: true },
        })
      : [];
    const performerMap = new Map(performers.map((p) => [p.id, p.email]));

    return NextResponse.json({
      pipeline,
      pool,
      kpis: {
        totalCandidates,
        conversionRate,
        avgScore: Math.round(scoreAgg._avg.totalScore ?? 0),
        avgTimeToHire,
        pendingReviews: reviewCandidates,
        redFlagCount,
      },
      byRestaurant,
      byPosition,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
        performedBy: a.performedBy ? performerMap.get(a.performedBy) || null : null,
      })),
      employees: {
        total: employeesTotal,
        onboardingPending,
        onboardingComplete,
      },
    });
  } catch (error) {
    logger.error("Stats error", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
