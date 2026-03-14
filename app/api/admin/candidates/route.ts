import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { POSITIONS, POSITION_LABELS, STATUS_LABELS } from "@/domain/types";
import { safeJsonParse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, email, positionApplied, restaurantId, notesAdmin } = body;

    if (!fullName?.trim() || !phone?.trim() || !positionApplied) {
      return NextResponse.json(
        { error: "Nombre, teléfono y cargo son obligatorios" },
        { status: 400 }
      );
    }

    if (!POSITIONS.includes(positionApplied)) {
      return NextResponse.json(
        { error: "Cargo inválido" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        positionApplied,
        restaurantId: restaurantId || null,
        notesAdmin: notesAdmin?.trim() || null,
        status: "PENDIENTE_EVALUACION",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "candidate_created_manual",
        entityType: "Candidate",
        entityId: candidate.id,
        performedBy: session.userId,
        details: JSON.stringify({ fullName: candidate.fullName, phone: candidate.phone }),
      },
    });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    logger.error("Error creating candidate manually", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 20;
    const skip = (page - 1) * limit;

    // Filters
    const position = url.searchParams.get("position");
    const status = url.searchParams.get("status");
    const minScore = url.searchParams.get("minScore");
    const maxScore = url.searchParams.get("maxScore");
    const restaurant = url.searchParams.get("restaurant");
    const hasRedFlags = url.searchParams.get("hasRedFlags");
    const requiresReview = url.searchParams.get("requiresReview");
    const search = url.searchParams.get("search");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build where clause — all filtering done at DB level
    const where: Record<string, unknown> = { ...session.restaurantFilter };

    // Validate enum filters before using
    if (position && position in POSITION_LABELS) {
      where.positionApplied = position;
    }
    if (status && status in STATUS_LABELS) {
      where.status = status;
    }
    if (restaurant) {
      where.restaurantId = restaurant;
    }

    // Search filter (name or phone)
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        createdAt.lte = to;
      }
      where.createdAt = createdAt;
    }

    // Score and evaluation filters require joining with evaluations
    const evaluationFilter: Record<string, unknown> = {};
    if (minScore) evaluationFilter.totalScore = { ...evaluationFilter.totalScore as object, gte: parseInt(minScore, 10) };
    if (maxScore) evaluationFilter.totalScore = { ...evaluationFilter.totalScore as object, lte: parseInt(maxScore, 10) };
    if (requiresReview === "true") evaluationFilter.requiresHumanReview = true;

    // If we have evaluation filters, add them to the where clause
    if (Object.keys(evaluationFilter).length > 0) {
      where.evaluations = { some: evaluationFilter };
    }

    // Build orderBy
    let orderBy: Record<string, unknown> = { createdAt: sortOrder };
    if (sortBy === "totalScore") {
      // For score sorting, we still order by createdAt as fallback
      // Score sorting is done post-query since it requires evaluation join
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    }

    // Count duplicates efficiently with a single groupBy query
    const duplicatePhones = await prisma.candidate.groupBy({
      by: ["phone"],
      where,
      _count: { phone: true },
      having: { phone: { _count: { gt: 1 } } },
    });
    const duplicatePhoneSet = new Set(duplicatePhones.map((d) => d.phone));

    // Main query — paginated at DB level
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          restaurant: { select: { id: true, name: true } },
          evaluations: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          decisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ]);

    // Enrich results (minimal post-processing, no N+1)
    let enriched = candidates.map((c) => {
      const evaluation = c.evaluations[0] || null;
      const decision = c.decisions[0] || null;
      const redFlags = evaluation ? safeJsonParse<string[]>(evaluation.redFlags, []) : [];

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        positionApplied: c.positionApplied,
        status: c.status,
        restaurantName: c.restaurant?.name ?? null,
        restaurantId: c.restaurantId,
        createdAt: c.createdAt,
        totalScore: evaluation?.totalScore ?? null,
        attitudeScore: evaluation?.attitudeScore ?? null,
        responsibilityScore: evaluation?.responsibilityScore ?? null,
        technicalScore: evaluation?.technicalScore ?? null,
        suggestedDecision: evaluation?.suggestedDecision ?? null,
        redFlags,
        requiresHumanReview: evaluation?.requiresHumanReview ?? false,
        adminDecision: decision?.decision ?? null,
        hasPhoto: !!c.photoPath,
        isDuplicate: duplicatePhoneSet.has(c.phone),
        duplicateCount: duplicatePhoneSet.has(c.phone)
          ? (duplicatePhones.find((d) => d.phone === c.phone)?._count.phone ?? 1) - 1
          : 0,
      };
    });

    // Post-query filter for hasRedFlags (requires parsing JSON, can't do in SQL easily)
    if (hasRedFlags === "true") {
      enriched = enriched.filter((c) => c.redFlags.length > 0);
    }

    // Score-based sorting (when sortBy is totalScore, re-sort the page)
    if (sortBy === "totalScore") {
      enriched.sort((a, b) => {
        const aScore = a.totalScore ?? -1;
        const bScore = b.totalScore ?? -1;
        return sortOrder === "desc" ? bScore - aScore : aScore - bScore;
      });
    }

    return NextResponse.json({
      candidates: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Error fetching candidates", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
