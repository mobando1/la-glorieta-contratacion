import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "connected";
  } catch {
    checks.db = "disconnected";
  }

  // Check critical env vars
  checks.auth_secret = process.env.AUTH_SECRET ? "set" : "missing";
  checks.llm_api_key = process.env.LLM_API_KEY ? "set" : "missing";
  checks.llm_model = process.env.LLM_MODEL || "not set";

  const allOk = checks.db === "connected" && checks.auth_secret === "set";

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
