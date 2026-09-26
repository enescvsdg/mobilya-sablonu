import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import {
  PREVIEW_COOKIE,
  PREVIEW_COOKIE_MAX_AGE_SECONDS,
  PREVIEW_HINT_COOKIE,
  createPreviewToken,
  safePreviewTarget,
  verifyPreviewToken,
} from "@/lib/preview";

/**
 * Panelden gelen kısa ömürlü bağlantıyı (/admin/onizleme) doğrular ve
 * tarayıcıya önizleme çerezini bırakır. Geçersiz ya da süresi dolmuş
 * bağlantı sessizce ana sayfaya döner.
 */
export function GET(request: NextRequest) {
  const { searchParams, protocol } = request.nextUrl;
  const home = new URL("/", request.url);

  if (!verifyPreviewToken("link", searchParams.get("t") ?? undefined)) {
    return NextResponse.redirect(home);
  }

  // "Yakında sayfasını gör" düğmesi sayfanın kendisine, "Sitede önizle"
  // istenen sayfaya (ör. taslak ürün) gider.
  const locale = searchParams.get("yakinda");
  const page = safePreviewTarget(searchParams.get("hedef"));
  const target = hasLocale(routing.locales, locale)
    ? new URL(`/yakinda/${locale}`, request.url)
    : page
      ? new URL(page, request.url)
      : home;

  const response = NextResponse.redirect(target);
  const cookieOptions = {
    secure: protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
  };
  response.cookies.set(
    PREVIEW_COOKIE,
    createPreviewToken("cookie", PREVIEW_COOKIE_MAX_AGE_SECONDS),
    { ...cookieOptions, httpOnly: true }
  );
  response.cookies.set(PREVIEW_HINT_COOKIE, "1", cookieOptions);
  return response;
}
