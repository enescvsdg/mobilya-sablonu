import { createHmac, timingSafeEqual } from "node:crypto";

export { PREVIEW_COOKIE, PREVIEW_HINT_COOKIE } from "@/lib/preview-cookies";

/**
 * "Yakında" modu açıkken gerçek siteyi yalnızca panel kullanıcıları görür.
 *
 * Panel ayrı bir alt alan adında (admin.*) olduğu için oturum çerezi ana
 * siteye taşınamaz. Bunun yerine panel, ömrü kısa ve imzalı bir bağlantı
 * üretir (/admin/onizleme); ana sitedeki /onizleme bu bağlantıyı doğrulayıp
 * tarayıcıya yine imzalı, daha uzun ömürlü bir önizleme çerezi bırakır.
 * İmza AUTH_SECRET ile atılır; sahte bir çerez proxy'de reddedilir.
 */

export const PREVIEW_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/** Panelden siteye geçişte adres çubuğunda taşınan bağlantının ömrü. */
export const PREVIEW_LINK_TTL_SECONDS = 60;

type TokenPurpose = "link" | "cookie";

function sign(secret: string, purpose: TokenPurpose, expiresAt: number) {
  return createHmac("sha256", secret)
    .update(`site-onizleme:${purpose}:${expiresAt}`)
    .digest("base64url");
}

export function createPreviewToken(purpose: TokenPurpose, ttlSeconds: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET tanımlı değil.");
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${expiresAt}.${sign(secret, purpose, expiresAt)}`;
}

export function verifyPreviewToken(purpose: TokenPurpose, token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(expiresAt) || !signature) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(secret, purpose, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * Önizleme bağlantısının açacağı site sayfası (ör. taslak bir ürün:
 * /tr/urun/ornek-urun). Yalnızca dil önekli, sitenin kendi yolları kabul
 * edilir; başka bir siteye yönlendirmek için kullanılamaz.
 */
export function safePreviewTarget(value: string | null | undefined) {
  if (!value) return null;
  return /^\/[a-z]{2}(\/[a-z0-9-]+)*$/.test(value) ? value : null;
}
