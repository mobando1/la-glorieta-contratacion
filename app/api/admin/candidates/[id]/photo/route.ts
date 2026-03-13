import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { photoPath: true },
    });

    if (!candidate?.photoPath) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    if (!existsSync(candidate.photoPath)) {
      return NextResponse.json({ error: "Archivo no encontrado en disco" }, { status: 404 });
    }

    // Find the photo file in the directory
    const files = await readdir(candidate.photoPath);
    const photoFile = files.find((f) => f.startsWith("photo."));
    if (!photoFile) {
      return NextResponse.json({ error: "Archivo de foto no encontrado" }, { status: 404 });
    }

    const filePath = join(candidate.photoPath, photoFile);
    const fileBuffer = await readFile(filePath);
    const mimeType = photoFile.endsWith(".png") ? "image/png" : "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
