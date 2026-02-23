import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { validateTransition } from "@/domain/candidate-states";
import { sendInterviewInvitation } from "@/server/services/email";
import type { CandidateStatus } from "@/domain/types";

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

    validateTransition(candidate.status as CandidateStatus, "CITADO_ENTREVISTA");

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

    await prisma.$transaction(async (tx) => {
      // Create personal interview record with scheduled date
      await tx.personalInterview.create({
        data: {
          candidateId: id,
          adminObservations: "{}",
          answers: "{}",
          scheduledAt,
          isComplete: false,
        },
      });

      await tx.candidate.update({
        where: { id },
        data: { status: "CITADO_ENTREVISTA" },
      });

      await tx.auditLog.create({
        data: {
          action: "scheduled_interview",
          entityType: "Candidate",
          entityId: id,
          details: JSON.stringify({ scheduledAt }),
        },
      });
    });

    // Fire-and-forget: send interview invitation email if candidate has email
    if (candidate.email) {
      sendInterviewInvitation(
        candidate.email,
        candidate.fullName,
        candidate.restaurant?.name,
        scheduledAt?.toISOString()
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("Transición") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
