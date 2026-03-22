import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { put } from "@vercel/blob";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET() {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const documents = await prisma.companyDocument.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Solo administradores pueden gestionar documentos" }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const slug = formData.get("slug") as string | null;
    const file = formData.get("file") as File | null;

    if (!name?.trim() || !slug?.trim() || !file) {
      return NextResponse.json({ error: "Nombre, slug y archivo son obligatorios" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
    }

    const existing = await prisma.companyDocument.findUnique({
      where: { slug: slug.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe un documento con ese identificador" }, { status: 409 });
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const blob = await put(`company-documents/${slug.trim()}/${sanitizedFileName}`, file, {
      access: "private",
      contentType: "application/pdf",
    });

    const document = await prisma.companyDocument.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        fileName: file.name,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: "application/pdf",
        uploadedBy: session.email || session.userId,
      },
    });

    logger.info("Company document created", { documentId: document.id, slug: slug.trim() });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    logger.error("Error creating company document", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
