import { brand } from "@/config/brand";

/**
 * messages/*.json içindeki marka yer tutucuları. Metinler markadan bağımsız
 * yazılır; yükleme sırasında src/config/brand.ts'teki değerler konur:
 *
 *   {brandName}  görünen ad            (ör. "Örnek Mobilya")
 *   {legalName}  resmî unvan           (Gizlilik Politikası, Kullanım Şartları)
 *   {courtCity}  yetkili mahkeme şehri (Kullanım Şartları)
 */
const TOKENS = {
  brandName: brand.name,
  legalName: brand.legalName,
  courtCity: brand.courtCity,
} as const;

const TOKEN_PATTERN = /\{(brandName|legalName|courtCity)\}/g;

/** ICU biçiminde ' ve { } özel karakterdir; marka değerleri düz metin olarak kalsın. */
function escapeIcu(value: string) {
  return value.replace(/'/g, "''").replace(/[{}]/g, "'$&'");
}

export function withBrand<T>(messages: T): T {
  if (typeof messages === "string") {
    return messages.replace(TOKEN_PATTERN, (_, name: keyof typeof TOKENS) =>
      escapeIcu(TOKENS[name])
    ) as T;
  }
  if (messages && typeof messages === "object") {
    return Object.fromEntries(
      Object.entries(messages).map(([key, value]) => [key, withBrand(value)])
    ) as T;
  }
  return messages;
}
