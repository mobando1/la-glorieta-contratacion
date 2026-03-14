import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await checkRateLimit(ip, 10, { prefix: "photo-" }))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ninguna foto." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se aceptan archivos JPG, PNG o HEIC." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La foto no puede superar 10MB." },
        { status: 400 }
      );
    }

    const photoToken = uuidv4();
    const ext = file.type === "image/png" ? "png" : "jpg";
    const fileName = `candidate-photos/${photoToken}/photo.${ext}`;

    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type === "image/heic" || file.type === "image/heif" ? "image/jpeg" : file.type,
    });

    logger.info("Candidate photo uploaded to blob", { photoToken, fileSize: file.size, url: blob.url });

    return NextResponse.json({ photoToken, fileName: `photo.${ext}`, blobUrl: blob.url });
  } catch (error) {
    logger.error("Error uploading candidate photo", { error });
    return NextResponse.json(
      { error: "Error al subir la foto. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
