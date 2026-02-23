import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { validateTransition } from "@/domain/candidate-states";
import { decisionSchema } from "@/domain/schemas";
import { logger } from "@/lib/logger";
import { sendPreselectionEmail, sendRejectionEmail, sendDatabaseSavedEmail } from "@/server/services/email";
import type { CandidateStatus } from "@/domain/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = decisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Decisión inválida" },
        { status: 400 }
      );
    }

    const { decision, notes, overrideReason } = parsed.data;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
        restaurant: { select: { name: true } },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    if (!session.isSuperAdmin && candidate.restaurantId && !session.restaurantIds.includes(candidate.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este candidato" }, { status: 403 });
    }

    // Check if override reason is needed
    const evaluation = candidate.evaluations[0];
    const suggestedDecision = evaluation?.suggestedDecision;
    const isOverride =
      suggestedDecision &&
      decision !== suggestedDecision &&
      !(suggestedDecision === "PRESELECCIONAR" && decision === "PRESELECCIONADO");

    if (isOverride && !overrideReason?.trim()) {
      return NextResponse.json(
        { error: "Se requiere una razón para cambiar la sugerencia de la IA" },
        { status: 400 }
      );
    }

    // Map decision to status
    const newStatus = decision as CandidateStatus;

    // Validate state transition
    try {
      validateTransition(candidate.status as CandidateStatus, newStatus);
    } catch {
      return NextResponse.json(
        { error: `No se puede cambiar de ${candidate.status} a ${newStatus}` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.adminDecision.create({
        data: {
          candidateId: id,
          decision,
          notes: notes || null,
          overrideReason: isOverride ? overrideReason : null,
        },
      });

      await tx.candidate.update({
        where: { id },
        data: {
          status: newStatus,
          notesAdmin: notes || candidate.notesAdmin,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "admin_decision",
          entityType: "Candidate",
          entityId: id,
          details: JSON.stringify({
            decision,
            overrideReason: isOverride ? overrideReason : null,
            adminEmail: session.email,
          }),
        },
      });
    });

    // Fire-and-forget: send notification email based on decision
    if (candidate.email) {
      if (decision === "PRESELECCIONADO") {
        sendPreselectionEmail(candidate.email, candidate.fullName, candidate.restaurant?.name).catch(() => {});
      } else if (decision === "NO_CONTINUAR") {
        sendRejectionEmail(candidate.email, candidate.fullName, candidate.restaurant?.name).catch(() => {});
      } else if (decision === "BASE_DE_DATOS") {
        sendDatabaseSavedEmail(candidate.email, candidate.fullName, candidate.restaurant?.name).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Decision error", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
