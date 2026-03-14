import { prisma } from "@/server/db/prisma";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check rate limit for a given key (typically IP-based).
 * Returns true if within limit, false if exceeded.
 * Uses atomic database operations to prevent race conditions.
 */
export async function checkRateLimit(
  ip: string,
  limit: number,
  options?: { windowMs?: number; prefix?: string }
): Promise<boolean> {
  const key = options?.prefix ? `${options.prefix}${ip}` : ip;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Atomically reset expired windows and increment count
  await prisma.rateLimit.upsert({
    where: { id: key },
    update: {},
    create: { id: key, count: 0, windowStart: now },
  });

  // Reset window if expired
  await prisma.rateLimit.updateMany({
    where: { id: key, windowStart: { lt: windowStart } },
    data: { count: 0, windowStart: now },
  });

  // Atomic increment with limit check
  const result = await prisma.rateLimit.updateMany({
    where: { id: key, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });

  return result.count > 0;
}
