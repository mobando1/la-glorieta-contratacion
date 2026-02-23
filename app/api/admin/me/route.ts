import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    email: session.email,
    role: session.role,
    restaurantIds: session.restaurantIds,
  });
}
