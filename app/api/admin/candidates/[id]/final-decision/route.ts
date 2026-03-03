import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { validateTransition } from "@/domain/candidate-states";
import { sendRejectionEmail, sendDatabaseSavedEmail, sendHiredEmail } from "@/server/services/email";
import type { CandidateStatus } from "@/domain/types";
import { z } from "zod";

const finalDecisionSchema = z.object({
  decision: z.enum(["CONTRATADO", "BASE_DE_DATOS", "NO_CONTINUAR"]),
  notes: z.string().max(1000).optional().default(""),
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

    const parsed = finalDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { restaurant: { select: { name: true } } },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    if (!session.isSuperAdmin && candidate.restaurantId && !session.restaurantIds.includes(candidate.restaurantId)) {
      return NextResponse.json({ error: "Sin permiso para este candidato" }, { status: 403 });
    }

    validateTransition(
      candidate.status as CandidateStatus,
      parsed.data.decision as CandidateStatus
    );

    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id },
        data: { status: parsed.data.decision },
      });

      await tx.adminDecision.create({
        data: {
          candidateId: id,
          decision: parsed.data.decision,
          notes: parsed.data.notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "final_decision",
          entityType: "Candidate",
          entityId: id,
          details: JSON.stringify({
            decision: parsed.data.decision,
          }),
        },
      });
    });

    // Fire-and-forget: send notification email based on decision
    if (candidate.email) {
      if (parsed.data.decision === "CONTRATADO") {
        sendHiredEmail(candidate.email, candidate.fullName, candidate.positionApplied, candidate.restaurant?.name).catch(() => {});
      } else if (parsed.data.decision === "NO_CONTINUAR") {
        sendRejectionEmail(candidate.email, candidate.fullName, candidate.restaurant?.name).catch(() => {});
      } else if (parsed.data.decision === "BASE_DE_DATOS") {
        sendDatabaseSavedEmail(candidate.email, candidate.fullName, candidate.restaurant?.name).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("Transición") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
