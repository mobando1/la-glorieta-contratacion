import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { logger } from "@/lib/logger";

let resendInstance: any = null;

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, body: emailBody } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: "Asunto y contenido son obligatorios" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { email: true, fullName: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    if (!candidate.email) {
      return NextResponse.json(
        { error: "El candidato no tiene email registrado" },
        { status: 400 }
      );
    }

    const resend = await getResend();
    if (!resend) {
      return NextResponse.json(
        { error: "Servicio de email no configurado (RESEND_API_KEY)" },
        { status: 500 }
      );
    }

    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin: 0;">La Glorieta y Salom&eacute;</h2>
          <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">Guaduas, Cundinamarca</p>
        </div>
        <div style="white-space: pre-line; color: #333; line-height: 1.6; font-size: 15px;">
${emailBody}
        </div>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: candidate.email,
      subject,
      html,
    });

    await prisma.auditLog.create({
      data: {
        action: "email_sent",
        entityType: "Candidate",
        entityId: id,
        details: JSON.stringify({ subject, to: candidate.email }),
        performedBy: session.email,
      },
    });

    logger.info("Decision email sent", { candidateId: id, to: candidate.email, subject });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error sending decision email", { error: String(error) });
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}
