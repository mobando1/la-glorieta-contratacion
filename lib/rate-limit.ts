import { prisma } from "@/server/db/prisma";

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check rate limit for a given key (typically IP-based).
 * Returns true if within limit, false if exceeded.
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

  const entry = await prisma.rateLimit.findUnique({ where: { id: key } });

  if (!entry || entry.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { id: key },
      update: { count: 1, windowStart: now },
      create: { id: key, count: 1, windowStart: now },
    });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { id: key },
    data: { count: entry.count + 1 },
  });
  return true;
}
