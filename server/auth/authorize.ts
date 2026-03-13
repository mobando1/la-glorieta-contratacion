import { getSession, type SessionPayload } from "./session";
import { NextResponse } from "next/server";

export interface AuthorizedSession extends SessionPayload {
  isSuperAdmin: boolean;
  restaurantFilter: Record<string, unknown>;
}

export async function getAuthorizedSession(): Promise<AuthorizedSession | null> {
  const session = await getSession();
  if (!session) return null;

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const restaurantFilter: Record<string, unknown> = isSuperAdmin
    ? {}
    : { restaurantId: { in: session.restaurantIds } };

  return {
    ...session,
    isSuperAdmin,
    restaurantFilter,
  };
}

/**
 * Check if the session has access to a candidate's restaurant.
 * Returns a 403 NextResponse if access is denied, or null if allowed.
 */
export function checkCandidateAccess(
  session: AuthorizedSession,
  candidate: { restaurantId: string | null }
): NextResponse | null {
  if (
    !session.isSuperAdmin &&
    candidate.restaurantId &&
    !session.restaurantIds.includes(candidate.restaurantId)
  ) {
    return NextResponse.json(
      { error: "Sin permiso para este candidato" },
      { status: 403 }
    );
  }
  return null;
}
