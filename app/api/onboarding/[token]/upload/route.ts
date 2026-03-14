import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { put } from "@vercel/blob";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await checkRateLimit(ip, 20, { prefix: "onboarding-upload-" }))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
    });

    if (!employee) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
    }

    if (new Date() > employee.tokenExpiresAt) {
      return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 410 });
    }

    if (employee.onboardingStatus === "COMPLETADO") {
      return NextResponse.json({ error: "El onboarding ya fue completado" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    if (!docType || !["CEDULA_FRENTE", "CEDULA_REVERSO", "OTRO"].includes(docType)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 5MB" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);
    const uniquePrefix = crypto.randomUUID().substring(0, 8);
    const blobPath = `documents/${employee.id}/${uniquePrefix}-${sanitizedName}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: "private",
      contentType: file.type,
    });

    // Create document record with blob URL
    const document = await prisma.document.create({
      data: {
        employeeId: employee.id,
        type: docType,
        fileName: sanitizedName,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // Update onboarding status if still PENDIENTE
    if (employee.onboardingStatus === "PENDIENTE") {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStatus: "EN_PROGRESO" },
      });
    }

    return NextResponse.json({
      documentId: document.id,
      fileName: sanitizedName,
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
