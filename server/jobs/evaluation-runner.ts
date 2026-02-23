import { prisma } from "@/server/db/prisma";
import { evaluateCandidate } from "@/server/services/ai-evaluator";
import { evaluatePersonalInterview } from "@/server/services/personal-interview-evaluator";
import { logger } from "@/lib/logger";
import type { InterviewAnswers, AdminObservations, PersonalInterviewAnswers, Position } from "@/domain/types";

export async function runEvaluation(
  candidateId: string,
  interviewId: string
): Promise<void> {
  const interview = await prisma.applicationInterview.findUnique({
    where: { id: interviewId },
    include: { candidate: { include: { restaurant: true } } },
  });

  if (!interview) {
    throw new Error(`Interview ${interviewId} not found`);
  }

  // Optimistic lock: atomically claim this candidate for evaluation
  const claimed = await prisma.candidate.updateMany({
    where: { id: candidateId, status: "PENDIENTE_EVALUACION" },
    data: { status: "EVALUANDO" },
  });

  if (claimed.count === 0) {
    logger.info("Candidate not in PENDIENTE_EVALUACION, skipping", { candidateId });
    return;
  }

  const answers = JSON.parse(interview.answers) as InterviewAnswers;

  try {
    const result = await evaluateCandidate(answers, interview.candidate.restaurant?.name);

    await prisma.$transaction(async (tx) => {
      await tx.aIEvaluation.create({
        data: {
          candidateId,
          interviewId,
          modelVersion: process.env.LLM_MODEL || "unknown",
          rubricVersion: process.env.RUBRIC_VERSION || "2.0",
          attitudeScore: result.attitudeScore,
          responsibilityScore: result.responsibilityScore,
          technicalScore: result.technicalScore,
          totalScore: result.totalScore,
          suggestedDecision: result.suggestedDecision,
          redFlags: JSON.stringify(result.redFlags),
          summary: result.summary,
          rationale: result.rationale,
          confidence: result.confidence,
          requiresHumanReview: result.requiresHumanReview,
        },
      });

      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: "EVALUADO" },
      });

      await tx.auditLog.create({
        data: {
          action: "ai_evaluated",
          entityType: "Candidate",
          entityId: candidateId,
          details: JSON.stringify({
            totalScore: result.totalScore,
            suggestedDecision: result.suggestedDecision,
          }),
        },
      });
    });

    logger.info("Candidate evaluated", {
      candidateId,
      totalScore: result.totalScore,
      suggestedDecision: result.suggestedDecision,
    });
  } catch (error) {
    logger.error("Evaluation failed", { candidateId, error: String(error) });

    // Revert status so candidate can be retried
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "PENDIENTE_EVALUACION" },
    });

    await prisma.auditLog.create({
      data: {
        action: "ai_evaluation_failed",
        entityType: "Candidate",
        entityId: candidateId,
        details: String(error),
      },
    });
  }
}

export async function runPendingEvaluations(): Promise<{
  processed: number;
  failed: number;
}> {
  const pending = await prisma.candidate.findMany({
    where: { status: "PENDIENTE_EVALUACION" },
    include: {
      interviews: {
        where: { isComplete: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let processed = 0;
  let failed = 0;

  for (const candidate of pending) {
    const interview = candidate.interviews[0];
    if (!interview) continue;

    try {
      await runEvaluation(candidate.id, interview.id);
      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}

export async function runPersonalInterviewEvaluation(
  candidateId: string,
  personalInterviewId: string
): Promise<void> {
  const personalInterview = await prisma.personalInterview.findUnique({
    where: { id: personalInterviewId },
    include: {
      candidate: {
        include: {
          restaurant: true,
          evaluations: {
            where: { evaluationType: "ONLINE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!personalInterview) {
    throw new Error(`PersonalInterview ${personalInterviewId} not found`);
  }

  // Optimistic lock
  const claimed = await prisma.candidate.updateMany({
    where: { id: candidateId, status: "ENTREVISTA_REALIZADA" },
    data: { status: "EVALUANDO_ENTREVISTA" },
  });

  if (claimed.count === 0) {
    logger.info("Candidate not in ENTREVISTA_REALIZADA, skipping", { candidateId });
    return;
  }

  const observations = JSON.parse(personalInterview.adminObservations) as AdminObservations;
  const answers = JSON.parse(personalInterview.answers) as PersonalInterviewAnswers;
  const onlineEval = personalInterview.candidate.evaluations[0];

  try {
    const result = await evaluatePersonalInterview({
      answers,
      observations,
      position: personalInterview.candidate.positionApplied as Position,
      restaurantName: personalInterview.candidate.restaurant?.name,
      onlineSummary: onlineEval?.summary,
      onlineTotalScore: onlineEval?.totalScore,
    });

    await prisma.$transaction(async (tx) => {
      await tx.aIEvaluation.create({
        data: {
          candidateId,
          personalInterviewId,
          evaluationType: "PERSONAL",
          modelVersion: process.env.LLM_MODEL || "unknown",
          rubricVersion: process.env.RUBRIC_VERSION || "2.0",
          attitudeScore: result.attitudeScore,
          responsibilityScore: result.responsibilityScore,
          technicalScore: result.technicalScore,
          totalScore: result.totalScore,
          suggestedDecision: result.suggestedDecision,
          redFlags: JSON.stringify(result.redFlags),
          summary: result.summary,
          rationale: result.rationale,
          confidence: result.confidence,
          requiresHumanReview: result.requiresHumanReview,
        },
      });

      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: "EVALUADO_ENTREVISTA" },
      });

      await tx.auditLog.create({
        data: {
          action: "personal_interview_evaluated",
          entityType: "Candidate",
          entityId: candidateId,
          details: JSON.stringify({
            totalScore: result.totalScore,
            suggestedDecision: result.suggestedDecision,
          }),
        },
      });
    });

    logger.info("Personal interview evaluated", {
      candidateId,
      totalScore: result.totalScore,
      suggestedDecision: result.suggestedDecision,
    });
  } catch (error) {
    logger.error("Personal interview evaluation failed", { candidateId, error: String(error) });

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "ENTREVISTA_REALIZADA" },
    });

    await prisma.auditLog.create({
      data: {
        action: "personal_interview_evaluation_failed",
        entityType: "Candidate",
        entityId: candidateId,
        details: String(error),
      },
    });
  }
}
