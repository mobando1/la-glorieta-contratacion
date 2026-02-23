import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
      include: {
        documents: { select: { type: true } },
      },
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

    // Validate required fields
    const missing: string[] = [];
    if (!employee.fullName) missing.push("Nombre completo");
    if (!employee.phone) missing.push("Teléfono");
    if (!employee.address) missing.push("Dirección");
    if (!employee.cedulaNumber) missing.push("Número de cédula");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos obligatorios: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate at least cedula frente is uploaded
    const hasCedulaFrente = employee.documents.some((d) => d.type === "CEDULA_FRENTE");
    if (!hasCedulaFrente) {
      return NextResponse.json(
        { error: "Debes subir al menos la foto de la parte frontal de tu cédula" },
        { status: 400 }
      );
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { onboardingStatus: "COMPLETADO" },
    });

    await prisma.auditLog.create({
      data: {
        action: "onboarding_completed",
        entityType: "Employee",
        entityId: employee.id,
        details: JSON.stringify({ candidateId: employee.candidateId }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
