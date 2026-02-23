import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { employmentStatusSchema } from "@/domain/schemas";
import { validateEmployeeTransition } from "@/domain/employee-states";
import type { EmploymentStatus } from "@/domain/types";

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

    const parsed = employmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { workPeriods: { where: { status: "ACTIVO" } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && employee.restaurantId && !session.restaurantIds.includes(employee.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este empleado" }, { status: 403 });
    }

    const fromStatus = employee.employmentStatus as EmploymentStatus;
    const toStatus = parsed.data.status;

    validateEmployeeTransition(fromStatus, toStatus);

    // If rehiring (→ ACTIVO), require contractType and position
    if (toStatus === "ACTIVO" && fromStatus !== "ACTIVO") {
      if (!parsed.data.contractType || !parsed.data.position) {
        return NextResponse.json(
          { error: "contractType y position son requeridos para recontratar" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      const activeWorkPeriod = employee.workPeriods[0];

      // Close active work period if leaving ACTIVO
      if (fromStatus === "ACTIVO" && activeWorkPeriod) {
        const periodStatus = toStatus === "NO_RECONTRATAR" ? "ABANDONADO" : "COMPLETADO";
        await tx.workPeriod.update({
          where: { id: activeWorkPeriod.id },
          data: {
            endDate: new Date(),
            status: periodStatus,
          },
        });

        if (periodStatus === "COMPLETADO") {
          await tx.employee.update({
            where: { id },
            data: { totalWorkPeriods: { increment: 1 } },
          });
        }
      }

      // Update employee status
      const updateData: Record<string, unknown> = {
        employmentStatus: toStatus,
      };

      if (toStatus === "NO_RECONTRATAR" || toStatus === "NO_DISPONIBLE" || toStatus === "DISPONIBLE") {
        if (fromStatus === "ACTIVO") {
          updateData.terminationDate = new Date();
        }
        if (parsed.data.terminationReason) {
          updateData.terminationReason = parsed.data.terminationReason;
        }
      }

      if (parsed.data.notes) {
        updateData.adminNotes = parsed.data.notes;
      }

      // If rehiring, create new work period
      if (toStatus === "ACTIVO" && fromStatus !== "ACTIVO") {
        updateData.terminationDate = null;
        updateData.terminationReason = null;
        updateData.hireDate = new Date();

        await tx.workPeriod.create({
          data: {
            employeeId: id,
            restaurantId: parsed.data.restaurantId || employee.restaurantId,
            startDate: new Date(),
            contractType: parsed.data.contractType!,
            position: parsed.data.position!,
          },
        });
      }

      await tx.employee.update({ where: { id }, data: updateData });

      await tx.auditLog.create({
        data: {
          action: "employment_status_changed",
          entityType: "Employee",
          entityId: id,
          details: JSON.stringify({
            from: fromStatus,
            to: toStatus,
            reason: parsed.data.terminationReason,
          }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("Transición") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
