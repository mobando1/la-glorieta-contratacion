import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { get } from "@vercel/blob";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; docId: string }> }
) {
  try {
    const { token, docId } = await params;

    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
      select: { id: true, tokenExpiresAt: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
    }

    if (new Date() > employee.tokenExpiresAt) {
      return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 410 });
    }

    const doc = await prisma.companyDocument.findUnique({
      where: { id: docId, isActive: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const result = await get(doc.filePath, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Documento no disponible" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": doc.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${doc.fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
