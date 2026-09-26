import { brand } from "@/config/brand";

/** Mağaza iletişim bilgileri; değerler src/config/brand.ts'ten gelir. */
export const siteConfig = brand.contact;

/**
 * Yasal metinlerin (Gizlilik Politikası / Kullanım Şartları) son güncelleme
 * tarihi. Metinler değiştiğinde elle güncellenmelidir — her derlemede
 * değişmemesi için bilinçli olarak sabittir.
 */
export const LEGAL_LAST_UPDATED = "2026-09-22";

export function formatLegalDate(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${LEGAL_LAST_UPDATED}T00:00:00Z`));
}

export function getGoogleMapsEmbedUrl() {
  const { lat, lng } = siteConfig.address;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

export function getGoogleMapsDirectionsUrl() {
  const { lat, lng } = siteConfig.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
