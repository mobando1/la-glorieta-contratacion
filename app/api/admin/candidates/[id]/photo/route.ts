import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";

export async function GET(
  _request: Request,
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
      select: { photoPath: true },
    });

    if (!candidate?.photoPath) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    // photoPath is now a Blob URL — redirect to it
    if (candidate.photoPath.startsWith("http")) {
      return NextResponse.redirect(candidate.photoPath);
    }

    // Legacy: local filesystem path (shouldn't happen after migration)
    return NextResponse.json({ error: "Foto no disponible" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
