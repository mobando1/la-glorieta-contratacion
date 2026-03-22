import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { validateTransition } from "@/domain/candidate-states";
import type { CandidateStatus } from "@/domain/types";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { runPersonalInterviewEvaluation } from "@/server/jobs/evaluation-runner";

const retrySchema = z.object({
  action: z.enum(["retry", "skip"]),
  skipNotes: z.string().max(1000).optional().default(""),
});

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

    const parsed = retrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        personalInterviews: {
          where: { isComplete: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && candidate.restaurantId && !session.restaurantIds.includes(candidate.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este candidato" }, { status: 403 });
    }

    if (candidate.status !== "EVALUANDO_ENTREVISTA") {
      return NextResponse.json(
        { error: `El candidato no está en estado EVALUANDO_ENTREVISTA (actual: ${candidate.status})` },
        { status: 400 }
      );
    }

    if (parsed.data.action === "retry") {
      validateTransition(
        candidate.status as CandidateStatus,
        "ENTREVISTA_REALIZADA"
      );

      await prisma.$transaction(async (tx) => {
        await tx.candidate.update({
          where: { id },
          data: { status: "ENTREVISTA_REALIZADA" },
        });

        await tx.auditLog.create({
          data: {
            action: "personal_interview_evaluation_reset",
            entityType: "Candidate",
            entityId: id,
            performedBy: session.userId,
          },
        });
      });

      // Re-trigger evaluation
      const personalInterview = candidate.personalInterviews[0];
      if (personalInterview) {
        runPersonalInterviewEvaluation(id, personalInterview.id).catch((err) => {
          logger.error("Background retry personal interview evaluation failed", { error: String(err) });
        });
      }

      return NextResponse.json({ ok: true, action: "retry" });
    }

    // action === "skip"
    validateTransition(
      candidate.status as CandidateStatus,
      "EVALUADO_ENTREVISTA"
    );

    const personalInterview = candidate.personalInterviews[0];

    await prisma.$transaction(async (tx) => {
      await tx.aIEvaluation.create({
        data: {
          candidateId: id,
          personalInterviewId: personalInterview?.id,
          evaluationType: "PERSONAL",
          modelVersion: "manual-skip",
          rubricVersion: "N/A",
          attitudeScore: 0,
          responsibilityScore: 0,
          technicalScore: 0,
          totalScore: 0,
          suggestedDecision: "REQUIERE_REVISION",
          redFlags: "[]",
          summary: "Evaluación IA omitida manualmente por administrador.",
          rationale: parsed.data.skipNotes || "Sin notas adicionales.",
          confidence: 0,
          requiresHumanReview: true,
        },
      });

      await tx.candidate.update({
        where: { id },
        data: { status: "EVALUADO_ENTREVISTA" },
      });

      await tx.auditLog.create({
        data: {
          action: "personal_interview_evaluation_skipped",
          entityType: "Candidate",
          entityId: id,
          details: JSON.stringify({ skipNotes: parsed.data.skipNotes }),
          performedBy: session.userId,
        },
      });
    });

    return NextResponse.json({ ok: true, action: "skip" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("Transición") ? 400 : 500;
    logger.error("Retry personal evaluation failed", { error: message });
    return NextResponse.json({ error: message }, { status });
  }
}
