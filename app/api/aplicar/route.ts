import { NextRequest, NextResponse } from "next/server";
import { list, copy } from "@vercel/blob";
import { prisma } from "@/server/db/prisma";
import { validateFullInterview, normalizePhone } from "@/domain/validation";
import { interviewSubmissionSchema } from "@/domain/schemas";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendApplicationReceivedEmail, sendNewCandidateNotificationToAdmins } from "@/server/services/email";
import type { InterviewAnswers } from "@/domain/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await checkRateLimit(ip, 10))) {
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
    const photoToken = parsed.data.photoToken;

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

    // Link uploaded photo to candidate if provided
    if (photoToken) {
      try {
        // Find the blob uploaded with this token
        const { blobs } = await list({ prefix: `candidate-photos/${photoToken}/` });
        if (blobs.length > 0) {
          const originalBlob = blobs[0];
          // Copy to candidate-specific path
          const newPath = `candidate-photos/${result.candidateId}/photo.${originalBlob.pathname.endsWith(".png") ? "png" : "jpg"}`;
          const newBlob = await copy(originalBlob.url, newPath, { access: "public" });
          await prisma.candidate.update({
            where: { id: result.candidateId },
            data: { photoPath: newBlob.url },
          });
          logger.info("Candidate photo linked", { candidateId: result.candidateId, url: newBlob.url });
        }
      } catch {
        logger.warn("Failed to link candidate photo", { photoToken, candidateId: result.candidateId });
      }
    }

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

    // Fire-and-forget: notify all active admins
    const restaurantName = answers.basic.restaurantId
      ? (await prisma.restaurant.findUnique({ where: { id: answers.basic.restaurantId }, select: { name: true } }))?.name || "Sin restaurante"
      : "Sin restaurante";
    sendNewCandidateNotificationToAdmins(
      answers.basic.fullName,
      answers.basic.positionApplied,
      restaurantName,
      result.candidateId
    ).catch(() => {});

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
