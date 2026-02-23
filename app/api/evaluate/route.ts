import { NextRequest, NextResponse } from "next/server";
import { runEvaluation, runPendingEvaluations } from "@/server/jobs/evaluation-runner";
import { getSession } from "@/server/auth/session";
import { logger } from "@/lib/logger";

const INTERNAL_KEY = process.env.AUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Allow internal calls (from aplicar/route.ts) or authenticated admin
    const internalKey = request.headers.get("x-internal-key");
    const isInternalCall = INTERNAL_KEY && internalKey === INTERNAL_KEY;

    if (!isInternalCall) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { candidateId, interviewId } = body;

    if (candidateId && interviewId) {
      // Evaluate specific candidate
      await runEvaluation(candidateId, interviewId);
      return NextResponse.json({ success: true });
    }

    // Run all pending evaluations
    const result = await runPendingEvaluations();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Evaluation API error", { error: String(error) });
    return NextResponse.json(
      { error: "Error en evaluación", details: String(error) },
      { status: 500 }
    );
  }
}
