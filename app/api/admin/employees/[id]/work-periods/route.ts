import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { workPeriodSchema } from "@/domain/schemas";

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

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && employee.restaurantId && !session.restaurantIds.includes(employee.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este empleado" }, { status: 403 });
    }

    const workPeriods = await prisma.workPeriod.findMany({
      where: { employeeId: id },
      include: {
        review: true,
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ workPeriods });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
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

    const parsed = workPeriodSchema.safeParse(body);
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

    if (employee.employmentStatus !== "ACTIVO") {
      return NextResponse.json(
        { error: "Solo se pueden crear períodos para empleados activos" },
        { status: 400 }
      );
    }

    // Check no active period exists
    const activePeriod = await prisma.workPeriod.findFirst({
      where: { employeeId: id, status: "ACTIVO" },
    });

    if (activePeriod) {
      return NextResponse.json(
        { error: "Ya existe un período de trabajo activo para este empleado" },
        { status: 409 }
      );
    }

    const workPeriod = await prisma.workPeriod.create({
      data: {
        employeeId: id,
        restaurantId: parsed.data.restaurantId || employee.restaurantId,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        contractType: parsed.data.contractType,
        position: parsed.data.position,
        notes: parsed.data.notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "work_period_created",
        entityType: "WorkPeriod",
        entityId: workPeriod.id,
        details: JSON.stringify({ employeeId: id }),
      },
    });

    return NextResponse.json({ workPeriod }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
