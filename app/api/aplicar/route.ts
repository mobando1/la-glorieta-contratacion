import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { validateFullInterview, normalizePhone } from "@/domain/validation";
import { interviewSubmissionSchema } from "@/domain/schemas";
import { logger } from "@/lib/logger";
import { sendApplicationReceivedEmail } from "@/server/services/email";
import type { InterviewAnswers } from "@/domain/types";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);

  const entry = await prisma.rateLimit.findUnique({ where: { id: ip } });

  if (!entry || entry.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { id: ip },
      update: { count: 1, windowStart: now },
      create: { id: ip, count: 1, windowStart: now },
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { id: ip },
    data: { count: entry.count + 1 },
  });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Has enviado demasiadas solicitudes. Intenta más tarde." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = interviewSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de entrevista inválidos" },
        { status: 400 }
      );
    }

    const answers = parsed.data.answers as InterviewAnswers;
    const completionTimeSeconds = parsed.data.completionTimeSeconds;

    // Server-side validation
    const errors = validateFullInterview(answers);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(answers.basic.phone);

    // Create candidate and interview in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.create({
        data: {
          fullName: answers.basic.fullName.trim(),
          phone: normalizedPhone,
          email: answers.basic.email?.trim() || null,
          positionApplied: answers.basic.positionApplied,
          restaurantId: answers.basic.restaurantId || null,
          status: "PENDIENTE_EVALUACION",
        },
      });

      const interview = await tx.applicationInterview.create({
        data: {
          candidateId: candidate.id,
          answers: JSON.stringify(answers),
          completionTimeSeconds: completionTimeSeconds || null,
          isComplete: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "candidate_created",
          entityType: "Candidate",
          entityId: candidate.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "interview_submitted",
          entityType: "ApplicationInterview",
          entityId: interview.id,
        },
      });

      return { candidateId: candidate.id, interviewId: interview.id };
    });

    // Fire-and-forget: trigger AI evaluation
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const internalKey = process.env.AUTH_SECRET || "";
    fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify({
        candidateId: result.candidateId,
        interviewId: result.interviewId,
      }),
    }).catch(() => {
      // Silently fail — runner can pick it up later
    });

    // Fire-and-forget: send thank-you email
    if (answers.basic.email) {
      sendApplicationReceivedEmail(answers.basic.email, answers.basic.fullName).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Tu entrevista ha sido enviada exitosamente. ¡Gracias por aplicar!",
    });
  } catch (error) {
    logger.error("Error submitting interview", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
