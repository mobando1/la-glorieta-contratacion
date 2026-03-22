import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
      select: { id: true, tokenExpiresAt: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
    }

    if (new Date() > employee.tokenExpiresAt) {
      return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 410 });
    }

    const documents = await prisma.companyDocument.findMany({
      where: { isActive: true },
      select: { id: true, name: true, fileName: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
