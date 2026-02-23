import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { restaurantSchema } from "@/domain/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Sin permiso para esta acción" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = restaurantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.restaurant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (parsed.data.slug !== existing.slug) {
      const slugTaken = await prisma.restaurant.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "Ya existe un restaurante con ese slug" },
          { status: 409 }
        );
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        address: parsed.data.address || null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ restaurant });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Sin permiso para esta acción" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.restaurant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
