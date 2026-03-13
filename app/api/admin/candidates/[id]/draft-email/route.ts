import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { generateEmailDraft } from "@/server/services/email-draft-generator";
import { POSITION_LABELS } from "@/domain/types";
import type { Position } from "@/domain/types";

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
    const { decision, reason, notes } = body;

    if (!decision || !reason) {
      return NextResponse.json(
        { error: "Decisión y razón son obligatorios" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        restaurant: { select: { name: true } },
        evaluations: {
          where: { evaluationType: "ONLINE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { summary: true },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const positionLabel = POSITION_LABELS[candidate.positionApplied as Position] || candidate.positionApplied;
    const restaurantName = candidate.restaurant?.name || "La Glorieta y Salomé";
    const evaluationSummary = candidate.evaluations[0]?.summary;

    const draft = await generateEmailDraft({
      candidateName: candidate.fullName,
      position: positionLabel,
      restaurantName,
      decision,
      reason,
      evaluationSummary: evaluationSummary || undefined,
      adminNotes: notes || undefined,
    });

    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar borrador" },
      { status: 500 }
    );
  }
}
