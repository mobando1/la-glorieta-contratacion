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
    const tab = url.searchParams.get("tab") || "activos";
    const search = url.searchParams.get("search") || "";
    const contractType = url.searchParams.get("contractType") || "";
    const sortBy = url.searchParams.get("sortBy") || "recent";

    // Base filter: restaurant access
    const baseFilter = session.isSuperAdmin ? {} : session.restaurantFilter;

    // Tab filter
    const tabFilters: Record<string, Record<string, unknown>> = {
      activos: { employmentStatus: "ACTIVO" },
      disponibles: { employmentStatus: "DISPONIBLE" },
      todos: { employmentStatus: { not: "NO_RECONTRATAR" } },
      no_recontratar: { employmentStatus: "NO_RECONTRATAR" },
    };

    const tabFilter = tabFilters[tab] || tabFilters.activos;

    // Contract type filter
    const contractFilter = contractType ? { contractType } : {};

    // Sort
    const orderByMap: Record<string, Record<string, string>> = {
      priority: { priorityScore: "desc" },
      name: { fullName: "asc" },
      recent: { createdAt: "desc" },
    };
    const orderBy = orderByMap[sortBy] || orderByMap.recent;

    const employees = await prisma.employee.findMany({
      where: { ...baseFilter, ...tabFilter, ...contractFilter },
      include: {
        candidate: {
          select: {
            positionApplied: true,
            status: true,
          },
        },
        restaurant: {
          select: { id: true, name: true },
        },
        documents: {
          select: { id: true, type: true },
        },
        workPeriods: {
          where: { status: "ACTIVO" },
          take: 1,
        },
      },
      orderBy,
    });

    // Post-query search filter
    let filtered = employees;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (e) => e.fullName.toLowerCase().includes(s) || e.phone.includes(search)
      );
    }

    // Count by status for tab badges
    const statusCounts = await prisma.employee.groupBy({
      by: ["employmentStatus"],
      _count: true,
      where: baseFilter,
    });

    const counts: Record<string, number> = {
      activos: 0,
      disponibles: 0,
      todos: 0,
      no_recontratar: 0,
    };

    for (const row of statusCounts) {
      if (row.employmentStatus === "ACTIVO") counts.activos = row._count;
      else if (row.employmentStatus === "DISPONIBLE") counts.disponibles = row._count;
      else if (row.employmentStatus === "NO_RECONTRATAR") counts.no_recontratar = row._count;

      if (row.employmentStatus !== "NO_RECONTRATAR") {
        counts.todos += row._count;
      }
    }

    return NextResponse.json({
      employees: filtered.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        phone: e.phone,
        email: e.email,
        positionApplied: e.candidate.positionApplied,
        onboardingStatus: e.onboardingStatus,
        employmentStatus: e.employmentStatus,
        contractType: e.contractType,
        priorityScore: e.priorityScore,
        reliabilityScore: e.reliabilityScore,
        totalWorkPeriods: e.totalWorkPeriods,
        terminationReason: e.terminationReason,
        documentsCount: e.documents.length,
        createdAt: e.createdAt.toISOString(),
        restaurantName: e.restaurant?.name || null,
        hasActiveWorkPeriod: e.workPeriods.length > 0,
      })),
      counts,
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
