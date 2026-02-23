import { getSession, type SessionPayload } from "./session";

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
