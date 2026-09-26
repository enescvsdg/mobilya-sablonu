import "server-only";
import { createHash } from "node:crypto";

/**
 * İsteği yapanın IP adresinin tuzlanmış özeti. Hız sınırları için
 * kullanılır; ham IP hiçbir yerde saklanmaz (KVKK).
 */
export function hashClientIp(headers: Pick<Headers, "get">): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip");
  if (!ip) return null;

  const salt = process.env.AUTH_SECRET ?? "site-ip-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
