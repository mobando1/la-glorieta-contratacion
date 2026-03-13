import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { adminUserCreateSchema } from "@/domain/schemas";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        restaurantAssignments: {
          select: {
            restaurant: { select: { id: true, name: true } },
          },
        },
      },
    });

    const formatted = users.map((u) => ({
      ...u,
      restaurants: u.restaurantAssignments.map((a) => a.restaurant),
      restaurantAssignments: undefined,
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    logger.error("Error listing admin users", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const { email, password, role, restaurantIds } = parsed.data;

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        role,
        restaurantAssignments: {
          create: restaurantIds.map((rid) => ({ restaurantId: rid })),
        },
      },
      select: { id: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "admin_user_created",
        entityType: "AdminUser",
        entityId: user.id,
        details: JSON.stringify({ email, role }),
        performedBy: session.userId,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    logger.error("Error creating admin user", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
