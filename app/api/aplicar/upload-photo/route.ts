import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/server/db/prisma";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `photo-${ip}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);

  const entry = await prisma.rateLimit.findUnique({ where: { id: key } });

  if (!entry || entry.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { id: key },
      update: { count: 1, windowStart: now },
      create: { id: key, count: 1, windowStart: now },
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { id: key },
    data: { count: entry.count + 1 },
  });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!(await checkRateLimit(ip))) {
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
        { error: "Solo se aceptan archivos JPG o PNG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La foto no puede superar 3MB." },
        { status: 400 }
      );
    }

    const photoToken = uuidv4();
    const ext = file.type === "image/png" ? "png" : "jpg";
    const fileName = `photo.${ext}`;
    const dirPath = join(process.cwd(), "uploads", "candidate-photos", photoToken);

    await mkdir(dirPath, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dirPath, fileName), buffer);

    logger.info("Candidate photo uploaded", { photoToken, fileSize: file.size, mimeType: file.type });

    return NextResponse.json({ photoToken, fileName });
  } catch (error) {
    logger.error("Error uploading candidate photo", { error });
    return NextResponse.json(
      { error: "Error al subir la foto. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
