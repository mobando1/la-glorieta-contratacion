import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const position = url.searchParams.get("position");
    const status = url.searchParams.get("status");
    const hasRedFlags = url.searchParams.get("hasRedFlags");
    const requiresReview = url.searchParams.get("requiresReview");

    const where: Record<string, unknown> = { ...session.restaurantFilter };
    if (position) where.positionApplied = position;
    if (status) where.status = status;

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        evaluations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        decisions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let rows = candidates.map((c) => {
      const evaluation = c.evaluations[0] || null;
      const decision = c.decisions[0] || null;
      const redFlags = evaluation ? JSON.parse(evaluation.redFlags) : [];

      return {
        nombre: c.fullName,
        telefono: c.phone,
        cargo: c.positionApplied,
        estado: c.status,
        fecha: new Date(c.createdAt).toLocaleDateString("es-CO"),
        totalScore: evaluation?.totalScore ?? "",
        sugerenciaIA: evaluation?.suggestedDecision ?? "",
        redFlags: redFlags.join("; "),
        decisionAdmin: decision?.decision ?? "",
        notasAdmin: decision?.notes ?? "",
        requiresHumanReview: evaluation?.requiresHumanReview ?? false,
      };
    });

    // Post-query filters
    if (hasRedFlags === "true") {
      rows = rows.filter((r) => r.redFlags.length > 0);
    }
    if (requiresReview === "true") {
      rows = rows.filter((r) => r.requiresHumanReview);
    }

    // Build CSV
    const headers = [
      "Nombre",
      "Teléfono",
      "Cargo",
      "Estado",
      "Fecha",
      "Score Total",
      "Sugerencia IA",
      "Red Flags",
      "Decisión Admin",
      "Notas",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          escapeCSV(r.nombre),
          escapeCSV(r.telefono),
          escapeCSV(r.cargo),
          escapeCSV(r.estado),
          escapeCSV(r.fecha),
          r.totalScore,
          escapeCSV(String(r.sugerenciaIA)),
          escapeCSV(r.redFlags),
          escapeCSV(String(r.decisionAdmin)),
          escapeCSV(String(r.notasAdmin)),
        ].join(",")
      ),
    ];

    const csv = "\uFEFF" + csvRows.join("\n"); // BOM for Excel compatibility

    // Log export
    await prisma.auditLog.create({
      data: {
        action: "export_csv",
        entityType: "Report",
        entityId: "all",
        details: JSON.stringify({ count: rows.length }),
        performedBy: session.userId,
      },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="candidatos-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    logger.error("CSV export error", { error: String(error) });
    return NextResponse.json(
      { error: "Error al exportar" },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (!value) return '""';
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
