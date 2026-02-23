import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    if (!existsSync(doc.filePath)) {
      return NextResponse.json({ error: "Archivo no encontrado en disco" }, { status: 404 });
    }

    const fileBuffer = await readFile(doc.filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
        "Content-Length": String(doc.fileSize),
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
