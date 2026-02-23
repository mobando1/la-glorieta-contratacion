import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { onboardingUpdateSchema } from "@/domain/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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

    const body = await request.json();
    const parsed = onboardingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Datos inválidos", errors: fieldErrors }, { status: 400 });
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address,
        cedulaNumber: parsed.data.cedulaNumber,
        onboardingStatus: employee.onboardingStatus === "PENDIENTE" ? "EN_PROGRESO" : employee.onboardingStatus,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
