import "server-only";
import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/seo";

/**
 * E-postadaki bağlantıların gideceği panel adresi.
 *
 * Canlıda adres sabittir (admin.<site>); isteğin Host başlığına
 * güvenilmez, böylece sahte bir başlıkla şifre sıfırlama bağlantısı
 * başka bir alan adına yönlendirilemez. Önizleme ve yerel ortamda panel
 * isteğin geldiği adrestedir.
 */
export async function getAdminBaseUrl() {
  if (process.env.VERCEL_ENV === "production") {
    const site = new URL(getSiteUrl());
    return `${site.protocol}//admin.${site.host}`;
  }
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
