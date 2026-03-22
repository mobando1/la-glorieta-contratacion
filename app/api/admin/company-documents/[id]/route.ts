import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { put, del } from "@vercel/blob";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Solo administradores pueden gestionar documentos" }, { status: 403 });
    }

    const { id } = await params;

    const doc = await prisma.companyDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Archivo es obligatorio" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
    }

    // Delete old blob
    if (doc.filePath.startsWith("http")) {
      try {
        await del(doc.filePath);
      } catch {
        logger.warn("Failed to delete old company document blob", { documentId: id });
      }
    }

    // Upload new file
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const blob = await put(`company-documents/${doc.slug}/${sanitizedFileName}`, file, {
      access: "private",
      contentType: "application/pdf",
    });

    const updated = await prisma.companyDocument.update({
      where: { id },
      data: {
        fileName: file.name,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: "application/pdf",
        uploadedBy: session.email || session.userId,
      },
    });

    logger.info("Company document replaced", { documentId: id });

    return NextResponse.json({ document: updated });
  } catch (error) {
    logger.error("Error replacing company document", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Solo administradores pueden gestionar documentos" }, { status: 403 });
    }

    const { id } = await params;

    const doc = await prisma.companyDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Delete blob
    if (doc.filePath.startsWith("http")) {
      try {
        await del(doc.filePath);
      } catch {
        logger.warn("Failed to delete company document blob", { documentId: id });
      }
    }

    await prisma.companyDocument.delete({ where: { id } });

    logger.info("Company document deleted", { documentId: id, slug: doc.slug });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error deleting company document", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
