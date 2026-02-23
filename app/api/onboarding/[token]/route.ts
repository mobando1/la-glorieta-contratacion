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
      include: {
        documents: {
          select: { id: true, type: true, fileName: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
    }

    if (new Date() > employee.tokenExpiresAt) {
      return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 410 });
    }

    return NextResponse.json({
      employee: {
        fullName: employee.fullName,
        phone: employee.phone,
        email: employee.email || "",
        address: employee.address || "",
        cedulaNumber: employee.cedulaNumber || "",
        onboardingStatus: employee.onboardingStatus,
      },
      documents: employee.documents.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
