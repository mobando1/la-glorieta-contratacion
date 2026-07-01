import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { logger } from "@/lib/logger";
import { CONTACT_METHODS, CONTACT_RESULTS } from "@/domain/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const contacts = await prisma.candidateContact.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    logger.error("Error fetching contacts", { error: String(error) });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
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

    const { contactMethod, contactResult = "CONTACTADO", notes } = body;

    if (!CONTACT_METHODS.includes(contactMethod)) {
      return NextResponse.json({ error: "Método de contacto inválido" }, { status: 400 });
    }

    if (!CONTACT_RESULTS.includes(contactResult)) {
      return NextResponse.json({ error: "Resultado de contacto inválido" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { id: true, fullName: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const contact = await prisma.candidateContact.create({
      data: {
        candidateId: id,
        contactMethod,
        contactResult,
        notes: notes || null,
        contactedBy: session.userId,
        contactedByName: session.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "candidate_contacted",
        entityType: "Candidate",
        entityId: id,
        details: JSON.stringify({ contactMethod, contactResult, contactedBy: session.email }),
        performedBy: session.userId,
      },
    });

    logger.info("Contact logged", { candidateId: id, contactMethod, contactResult, by: session.email });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    logger.error("Error creating contact", { error: String(error) });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
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

    const { contactId, contactResult, notes } = body;

    if (!contactId || !contactResult) {
      return NextResponse.json({ error: "contactId y contactResult son requeridos" }, { status: 400 });
    }

    if (!CONTACT_RESULTS.includes(contactResult)) {
      return NextResponse.json({ error: "Resultado de contacto inválido" }, { status: 400 });
    }

    const contact = await prisma.candidateContact.findFirst({
      where: { id: contactId, candidateId: id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }

    const updated = await prisma.candidateContact.update({
      where: { id: contactId },
      data: {
        contactResult,
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "contact_updated",
        entityType: "Candidate",
        entityId: id,
        details: JSON.stringify({ contactId, from: contact.contactResult, to: contactResult, updatedBy: session.email }),
        performedBy: session.userId,
      },
    });

    logger.info("Contact updated", { contactId, candidateId: id, from: contact.contactResult, to: contactResult });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Error updating contact", { error: String(error) });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
