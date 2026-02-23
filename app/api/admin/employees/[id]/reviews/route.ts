import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { performanceReviewSchema } from "@/domain/schemas";

function calculatePriorityScore(
  reliabilityScore: number,
  totalWorkPeriods: number,
  wouldRehirePercent: number
): number {
  const score = Math.round(
    reliabilityScore * 0.6 +
    Math.min(totalWorkPeriods * 5, 20) +
    wouldRehirePercent * 0.2
  );
  return Math.max(0, Math.min(100, score));
}

export async function POST(
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

    const parsed = performanceReviewSchema.safeParse(body);
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

    const workPeriod = await prisma.workPeriod.findFirst({
      where: { id: parsed.data.workPeriodId, employeeId: id },
      include: { review: true },
    });

    if (!workPeriod) {
      return NextResponse.json({ error: "Período de trabajo no encontrado" }, { status: 404 });
    }

    if (workPeriod.status === "ACTIVO") {
      return NextResponse.json(
        { error: "No se puede evaluar un período que está en curso" },
        { status: 400 }
      );
    }

    if (workPeriod.review) {
      return NextResponse.json(
        { error: "Este período ya tiene una evaluación" },
        { status: 409 }
      );
    }

    const overallScore = Math.round(
      (parsed.data.punctuality + parsed.data.attitude + parsed.data.quality +
        parsed.data.reliability + parsed.data.teamwork) / 5
    );

    const review = await prisma.performanceReview.create({
      data: {
        employeeId: id,
        workPeriodId: parsed.data.workPeriodId,
        punctuality: parsed.data.punctuality,
        attitude: parsed.data.attitude,
        quality: parsed.data.quality,
        reliability: parsed.data.reliability,
        teamwork: parsed.data.teamwork,
        overallScore,
        wouldRehire: parsed.data.wouldRehire,
        notes: parsed.data.notes || null,
      },
    });

    // Recalculate employee reliability and priority scores
    const allReviews = await prisma.performanceReview.findMany({
      where: { employeeId: id },
    });

    const avgOverall = allReviews.reduce((sum, r) => sum + r.overallScore, 0) / allReviews.length;
    const reliabilityScore = Math.round(avgOverall * 20); // Scale 1-5 → 0-100

    const wouldRehireCount = allReviews.filter((r) => r.wouldRehire).length;
    const wouldRehirePercent = Math.round((wouldRehireCount / allReviews.length) * 100);

    const priorityScore = calculatePriorityScore(
      reliabilityScore,
      employee.totalWorkPeriods,
      wouldRehirePercent
    );

    await prisma.employee.update({
      where: { id },
      data: { reliabilityScore, priorityScore },
    });

    await prisma.auditLog.create({
      data: {
        action: "performance_review_created",
        entityType: "PerformanceReview",
        entityId: review.id,
        details: JSON.stringify({
          employeeId: id,
          workPeriodId: parsed.data.workPeriodId,
          overallScore,
          wouldRehire: parsed.data.wouldRehire,
        }),
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
