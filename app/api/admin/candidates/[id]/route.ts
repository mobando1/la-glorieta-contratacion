import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { safeJsonParse } from "@/lib/utils";
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

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { id: true, name: true },
        },
        interviews: {
          orderBy: { createdAt: "desc" },
        },
        personalInterviews: {
          orderBy: { createdAt: "desc" },
        },
        evaluations: {
          orderBy: { createdAt: "desc" },
        },
        decisions: {
          orderBy: { createdAt: "desc" },
        },
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

    // Check for duplicates
    const duplicates = await prisma.candidate.findMany({
      where: {
        phone: candidate.phone,
        id: { not: candidate.id },
      },
      select: {
        id: true,
        fullName: true,
        positionApplied: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch audit log for timeline + email history
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: id, entityType: "Candidate" },
      orderBy: { createdAt: "asc" },
      select: {
        action: true,
        details: true,
        performedBy: true,
        createdAt: true,
      },
    });

    const onlineEvaluation = candidate.evaluations.find((e) => e.evaluationType === "ONLINE") || candidate.evaluations.find((e) => !e.personalInterviewId) || null;
    const personalEvaluation = candidate.evaluations.find((e) => e.evaluationType === "PERSONAL") || null;
    const interview = candidate.interviews[0] || null;
    const personalInterview = candidate.personalInterviews[0] || null;

    return NextResponse.json({
      candidate: {
        ...candidate,
        interviews: undefined,
        personalInterviews: undefined,
        evaluations: undefined,
        decisions: undefined,
      },
      interview: interview
        ? {
            ...interview,
            answers: safeJsonParse(interview.answers, {}),
          }
        : null,
      evaluation: onlineEvaluation
        ? {
            ...onlineEvaluation,
            redFlags: safeJsonParse(onlineEvaluation.redFlags, []),
          }
        : null,
      personalInterview: personalInterview
        ? {
            ...personalInterview,
            adminObservations: safeJsonParse(personalInterview.adminObservations, {}),
            answers: safeJsonParse(personalInterview.answers, {}),
          }
        : null,
      personalEvaluation: personalEvaluation
        ? {
            ...personalEvaluation,
            redFlags: safeJsonParse(personalEvaluation.redFlags, []),
          }
        : null,
      decisions: candidate.decisions,
      duplicates,
      auditLogs,
    });
  } catch (error) {
    logger.error("Error fetching candidate", { error: String(error) });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
