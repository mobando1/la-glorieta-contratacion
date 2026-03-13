import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { personalInterviewSchema } from "@/domain/schemas";
import { validateTransition } from "@/domain/candidate-states";
import { runPersonalInterviewEvaluation } from "@/server/jobs/evaluation-runner";
import { sendPostInterviewPassedEmail } from "@/server/services/email";
import type { CandidateStatus } from "@/domain/types";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const personalInterview = await prisma.personalInterview.findFirst({
      where: { candidateId: id },
      orderBy: { createdAt: "desc" },
      include: {
        evaluations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!personalInterview) {
      return NextResponse.json({ personalInterview: null });
    }

    const evaluation = personalInterview.evaluations[0] || null;

    return NextResponse.json({
      personalInterview: {
        ...personalInterview,
        adminObservations: JSON.parse(personalInterview.adminObservations),
        answers: JSON.parse(personalInterview.answers),
        evaluations: undefined,
      },
      personalEvaluation: evaluation
        ? {
            ...evaluation,
            redFlags: JSON.parse(evaluation.redFlags),
          }
        : null,
    });
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

    const parsed = personalInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && candidate.restaurantId && !session.restaurantIds.includes(candidate.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este candidato" }, { status: 403 });
    }

    validateTransition(candidate.status as CandidateStatus, "ENTREVISTA_REALIZADA");

    // Update existing personal interview or create new one
    const existingInterview = await prisma.personalInterview.findFirst({
      where: { candidateId: id, isComplete: false },
      orderBy: { createdAt: "desc" },
    });

    let personalInterviewId: string;

    await prisma.$transaction(async (tx) => {
      if (existingInterview) {
        await tx.personalInterview.update({
          where: { id: existingInterview.id },
          data: {
            adminObservations: JSON.stringify(parsed.data.observations),
            answers: JSON.stringify(parsed.data.answers),
            conductedAt: new Date(),
            isComplete: true,
          },
        });
        personalInterviewId = existingInterview.id;
      } else {
        const created = await tx.personalInterview.create({
          data: {
            candidateId: id,
            adminObservations: JSON.stringify(parsed.data.observations),
            answers: JSON.stringify(parsed.data.answers),
            conductedAt: new Date(),
            isComplete: true,
          },
        });
        personalInterviewId = created.id;
      }

      await tx.candidate.update({
        where: { id },
        data: { status: "ENTREVISTA_REALIZADA" },
      });

      await tx.auditLog.create({
        data: {
          action: "personal_interview_completed",
          entityType: "Candidate",
          entityId: id,
          details: JSON.stringify({ personalInterviewId }),
          performedBy: session.userId,
        },
      });
    });

    // Fire-and-forget: trigger AI evaluation
    runPersonalInterviewEvaluation(id, personalInterviewId!).catch((err) => {
      logger.error("Background personal interview evaluation failed", { error: String(err) });
    });

    // Fire-and-forget: send post-interview email
    if (candidate.email) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: candidate.restaurantId || "" },
        select: { name: true },
      }).catch(() => null);
      sendPostInterviewPassedEmail(candidate.email, candidate.fullName, restaurant?.name).catch(() => {});
    }

    return NextResponse.json({ ok: true, personalInterviewId: personalInterviewId! });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("Transición") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
