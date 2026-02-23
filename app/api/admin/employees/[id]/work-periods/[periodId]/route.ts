import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { workPeriodUpdateSchema } from "@/domain/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, periodId } = await params;
    const body = await request.json();

    const parsed = workPeriodUpdateSchema.safeParse(body);
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
      where: { id: periodId, employeeId: id },
    });

    if (!workPeriod) {
      return NextResponse.json({ error: "Período no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.endDate) {
      updateData.endDate = new Date(parsed.data.endDate);
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes || null;
    }

    if (parsed.data.status && parsed.data.status !== workPeriod.status) {
      updateData.status = parsed.data.status;

      // If closing the period, set endDate if not provided
      if (parsed.data.status !== "ACTIVO" && !updateData.endDate && !workPeriod.endDate) {
        updateData.endDate = new Date();
      }

      // Increment totalWorkPeriods when completing
      if (parsed.data.status === "COMPLETADO" && workPeriod.status === "ACTIVO") {
        await prisma.employee.update({
          where: { id },
          data: { totalWorkPeriods: { increment: 1 } },
        });
      }
    }

    const updated = await prisma.workPeriod.update({
      where: { id: periodId },
      data: updateData,
    });

    return NextResponse.json({ workPeriod: updated });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
