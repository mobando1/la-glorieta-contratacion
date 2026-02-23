import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
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
    const sortBy = url.searchParams.get("sortBy") || "totalScore";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Build where clause for candidates
    const where: Record<string, unknown> = { ...session.restaurantFilter };
    if (position) where.positionApplied = position;
    if (status) where.status = status;
    if (restaurant) where.restaurantId = restaurant;

    const candidates = await prisma.candidate.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    // Post-query filtering and enrichment
    let enriched = candidates.map((c) => {
      const evaluation = c.evaluations[0] || null;
      const decision = c.decisions[0] || null;

      // Check for duplicates
      const duplicateCount = candidates.filter(
        (other) => other.phone === c.phone && other.id !== c.id
      ).length;

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
        redFlags: evaluation ? JSON.parse(evaluation.redFlags) : [],
        requiresHumanReview: evaluation?.requiresHumanReview ?? false,
        adminDecision: decision?.decision ?? null,
        isDuplicate: duplicateCount > 0,
        duplicateCount,
      };
    });

    // Apply score filters
    if (minScore) {
      const min = parseInt(minScore, 10);
      enriched = enriched.filter(
        (c) => c.totalScore !== null && c.totalScore >= min
      );
    }
    if (maxScore) {
      const max = parseInt(maxScore, 10);
      enriched = enriched.filter(
        (c) => c.totalScore !== null && c.totalScore <= max
      );
    }
    if (hasRedFlags === "true") {
      enriched = enriched.filter((c) => c.redFlags.length > 0);
    }
    if (requiresReview === "true") {
      enriched = enriched.filter((c) => c.requiresHumanReview);
    }
    if (search) {
      const s = search.toLowerCase();
      enriched = enriched.filter(
        (c) => c.fullName.toLowerCase().includes(s) || c.phone.includes(search)
      );
    }

    // Sort
    enriched.sort((a, b) => {
      if (sortBy === "totalScore") {
        const aScore = a.totalScore ?? -1;
        const bScore = b.totalScore ?? -1;
        return sortOrder === "desc" ? bScore - aScore : aScore - bScore;
      }
      if (sortBy === "createdAt") {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
      }
      return 0;
    });

    const total = enriched.length;
    const paginated = enriched.slice(skip, skip + limit);

    return NextResponse.json({
      candidates: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
