import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { employeeUpdateSchema } from "@/domain/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        workPeriods: {
          include: {
            review: true,
            restaurant: { select: { id: true, name: true } },
          },
          orderBy: { startDate: "desc" },
        },
        restaurant: { select: { id: true, name: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && employee.restaurantId && !session.restaurantIds.includes(employee.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este empleado" }, { status: 403 });
    }

    const evaluation = employee.candidate.evaluations[0];

    // Calculate review stats
    const reviews = employee.workPeriods
      .map((wp) => wp.review)
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const avgScore = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length * 10) / 10
      : null;

    const wouldRehirePercent = reviews.length > 0
      ? Math.round((reviews.filter((r) => r.wouldRehire).length / reviews.length) * 100)
      : null;

    return NextResponse.json({
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        phone: employee.phone,
        email: employee.email,
        address: employee.address,
        cedulaNumber: employee.cedulaNumber,
        onboardingStatus: employee.onboardingStatus,
        onboardingToken: employee.onboardingToken,
        tokenExpiresAt: employee.tokenExpiresAt.toISOString(),
        createdAt: employee.createdAt.toISOString(),
        positionApplied: employee.candidate.positionApplied,
        candidateId: employee.candidateId,
        totalScore: evaluation?.totalScore ?? null,
        // Talent pool fields
        employmentStatus: employee.employmentStatus,
        contractType: employee.contractType,
        preferredShifts: employee.preferredShifts,
        priorityScore: employee.priorityScore,
        reliabilityScore: employee.reliabilityScore,
        totalWorkPeriods: employee.totalWorkPeriods,
        hireDate: employee.hireDate?.toISOString() ?? null,
        terminationDate: employee.terminationDate?.toISOString() ?? null,
        terminationReason: employee.terminationReason,
        adminNotes: employee.adminNotes,
        restaurantName: employee.restaurant?.name ?? null,
        restaurantId: employee.restaurantId,
        // Stats
        avgReviewScore: avgScore,
        wouldRehirePercent,
        reviewCount: reviews.length,
      },
      documents: employee.documents.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      workPeriods: employee.workPeriods.map((wp) => ({
        id: wp.id,
        startDate: wp.startDate.toISOString(),
        endDate: wp.endDate?.toISOString() ?? null,
        contractType: wp.contractType,
        position: wp.position,
        status: wp.status,
        notes: wp.notes,
        restaurantName: wp.restaurant?.name ?? null,
        review: wp.review
          ? {
              id: wp.review.id,
              punctuality: wp.review.punctuality,
              attitude: wp.review.attitude,
              quality: wp.review.quality,
              reliability: wp.review.reliability,
              teamwork: wp.review.teamwork,
              overallScore: wp.review.overallScore,
              wouldRehire: wp.review.wouldRehire,
              notes: wp.review.notes,
              createdAt: wp.review.createdAt.toISOString(),
            }
          : null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = employeeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && employee.restaurantId && !session.restaurantIds.includes(employee.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este empleado" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.contractType !== undefined) updateData.contractType = parsed.data.contractType;
    if (parsed.data.preferredShifts !== undefined) updateData.preferredShifts = parsed.data.preferredShifts;
    if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes;

    const updated = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      employee: {
        contractType: updated.contractType,
        preferredShifts: updated.preferredShifts,
        adminNotes: updated.adminNotes,
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
