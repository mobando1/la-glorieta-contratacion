/**
 * Safely parse JSON with a fallback value.
 * Prevents crashes from corrupted data in the database.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
