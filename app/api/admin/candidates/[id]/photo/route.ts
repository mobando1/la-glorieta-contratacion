import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { get, put, del } from "@vercel/blob";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // photoPath is a private Blob URL — use @vercel/blob get() for authenticated access
    if (candidate.photoPath.startsWith("http")) {
      const result = await get(candidate.photoPath, { access: "private" });
      if (!result || result.statusCode !== 200) {
        logger.warn("Failed to fetch photo from blob", { id });
        return NextResponse.json({ error: "Foto no disponible" }, { status: 404 });
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": result.blob.contentType || "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Legacy: local filesystem path (shouldn't happen after migration)
    return NextResponse.json({ error: "Foto no disponible" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ninguna foto" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se aceptan archivos de imagen" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "La foto no puede superar 10MB" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { photoPath: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Delete old photo if exists
    if (candidate.photoPath?.startsWith("http")) {
      try {
        await del(candidate.photoPath);
      } catch {
        logger.warn("Failed to delete old photo blob", { candidateId: id });
      }
    }

    // Upload new photo
    const ext = file.type === "image/png" ? "png" : "jpg";
    const contentType = file.type === "image/jpeg" || file.type === "image/png" ? file.type : "image/jpeg";
    const blob = await put(`candidate-photos/${id}/photo.${ext}`, file, {
      access: "private",
      contentType,
    });

    await prisma.candidate.update({
      where: { id },
      data: { photoPath: blob.url },
    });

    logger.info("Admin uploaded candidate photo", { candidateId: id, fileSize: file.size, uploadedBy: session.email });

    return NextResponse.json({ success: true, photoPath: blob.url });
  } catch (error) {
    logger.error("Error uploading candidate photo (admin)", { error: String(error) });
    return NextResponse.json({ error: "Error al subir la foto" }, { status: 500 });
  }
}
