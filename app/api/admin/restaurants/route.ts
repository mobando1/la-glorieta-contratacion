import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { restaurantSchema } from "@/domain/schemas";

export async function GET() {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const restaurants = await prisma.restaurant.findMany({
      where: session.isSuperAdmin ? {} : { id: { in: session.restaurantIds } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Solo administradores pueden crear restaurantes" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = restaurantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.restaurant.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un restaurante con ese slug" },
        { status: 409 }
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        address: parsed.data.address || null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
