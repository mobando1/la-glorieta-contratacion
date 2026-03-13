import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthorizedSession } from "@/server/auth/authorize";
import { adminUserUpdateSchema } from "@/domain/schemas";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.adminUser.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const recentActivity = await prisma.auditLog.findMany({
      where: { performedBy: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      user: {
        ...user,
        restaurants: user.restaurantAssignments.map((a) => a.restaurant),
        restaurantAssignments: undefined,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Error fetching admin user", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthorizedSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    // Cannot modify yourself
    if (id === session.userId) {
      return NextResponse.json(
        { error: "No puedes modificar tu propio usuario desde aquí" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { role, isActive, restaurantIds } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id },
        data: updateData,
      });

      if (restaurantIds !== undefined) {
        await tx.adminRestaurant.deleteMany({ where: { adminUserId: id } });
        if (restaurantIds.length > 0) {
          await tx.adminRestaurant.createMany({
            data: restaurantIds.map((rid) => ({ adminUserId: id, restaurantId: rid })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "admin_user_updated",
          entityType: "AdminUser",
          entityId: id,
          details: JSON.stringify(parsed.data),
          performedBy: session.userId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating admin user", { error: String(error) });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
