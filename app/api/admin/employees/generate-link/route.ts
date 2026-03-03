import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { validateTransition } from "@/domain/candidate-states";
import type { CandidateStatus } from "@/domain/types";
import { logger } from "@/lib/logger";
import { sendOnboardingLinkEmail } from "@/server/services/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId es requerido" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { employee: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    if (candidate.employee) {
      return NextResponse.json({ error: "El candidato ya tiene un perfil de empleado" }, { status: 400 });
    }

    // Validate transition
    try {
      validateTransition(candidate.status as CandidateStatus, "CONTRATADO");
    } catch {
      return NextResponse.json(
        { error: `No se puede contratar desde el estado ${candidate.status}` },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

    // Create employee and update candidate status in a transaction
    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          candidateId: candidate.id,
          fullName: candidate.fullName,
          phone: candidate.phone,
          email: candidate.email,
          restaurantId: candidate.restaurantId,
          onboardingToken: token,
          tokenExpiresAt,
          hireDate: new Date(),
        },
      });

      // Create first work period
      await tx.workPeriod.create({
        data: {
          employeeId: emp.id,
          restaurantId: candidate.restaurantId,
          startDate: new Date(),
          contractType: "TEMPORAL",
          position: candidate.positionApplied,
        },
      });

      await tx.candidate.update({
        where: { id: candidate.id },
        data: { status: "CONTRATADO" },
      });

      await tx.auditLog.create({
        data: {
          action: "employee_created",
          entityType: "Employee",
          entityId: emp.id,
          details: JSON.stringify({ candidateId: candidate.id }),
        },
      });

      return emp;
    });

    const onboardingUrl = `${baseUrl}/onboarding/${token}`;

    logger.info("Employee created with onboarding link", {
      employeeId: employee.id,
      candidateId: candidate.id,
    });

    // Fire-and-forget: send onboarding link email
    if (candidate.email) {
      sendOnboardingLinkEmail(candidate.email, candidate.fullName, onboardingUrl).catch(() => {});
    }

    return NextResponse.json({
      employeeId: employee.id,
      onboardingUrl,
      tokenExpiresAt: tokenExpiresAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error generating onboarding link", { error });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
