import { cookies } from "next/headers";
import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  }
  return secret;
}

const SECRET = getSecret();
const SESSION_COOKIE = "glorieta_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  restaurantIds: string[];
  exp: number;
}

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

function encode(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString("base64url");
  const signature = sign(base64);
  return `${base64}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64, signature] = parts;
  const expectedSig = sign(base64);
  if (signature !== expectedSig) return null;

  try {
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    const raw = JSON.parse(json);

    // Backward compatibility: old tokens may lack role/restaurantIds
    const payload: SessionPayload = {
      userId: raw.userId,
      email: raw.email,
      role: raw.role || "SUPER_ADMIN",
      restaurantIds: raw.restaurantIds || [],
      exp: raw.exp,
    };

    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  email: string,
  role: string = "SUPER_ADMIN",
  restaurantIds: string[] = []
): Promise<void> {
  const payload: SessionPayload = {
    userId,
    email,
    role,
    restaurantIds,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const token = encode(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
