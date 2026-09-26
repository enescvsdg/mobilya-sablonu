import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { getSiteGate } from "@/lib/site-gate";
import { PREVIEW_COOKIE, verifyPreviewToken } from "@/lib/preview";

const ADMIN_HOST_PREFIX = "admin.";

/**
 * next-intl yalnızca yayındaki dilleri tanısın: tarayıcı dili yayında
 * olmayan bir dile yönlendirmesin, alternatif dil başlıkları onları
 * listelemesin. Dil kümesi başına bir kez oluşturulur.
 */
const intlHandlers = new Map<string, ReturnType<typeof createMiddleware>>();

function intlFor(locales: readonly string[]) {
  const key = locales.join(",");
  let handler = intlHandlers.get(key);
  if (!handler) {
    handler = createMiddleware({ ...routing, locales: locales as typeof routing.locales });
    intlHandlers.set(key, handler);
  }
  return handler;
}

// Admin Panel is intentionally invisible on the public site: it only exists
// behind the admin.* subdomain. Requests to /admin/* on the main domain are
// blocked here so the panel cannot be discovered by guessing the URL.
// Everything else on the main domain goes through next-intl's locale
// detection/redirect (/tr, /en, … — only the languages that are live).
export default async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const isAdminHost = hostname.startsWith(ADMIN_HOST_PREFIX);

  if (isAdminHost) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // /api yalnızca panelin oturum uç noktalarını (/api/auth) barındırır;
  // ana alan adında açık kalırsa giriş denemeleri panel adresi
  // bilinmeden de yapılabilir. Vercel önizleme dağıtımlarının admin alt
  // alan adı yoktur; orada panel /admin altında açılır (önizleme
  // adresleri Vercel oturumu olmadan açılmaz).
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return process.env.VERCEL_ENV === "preview"
      ? NextResponse.next()
      : new NextResponse(null, { status: 404 });
  }

  // Panelden gelen önizleme bağlantısını karşılayan uç nokta.
  if (pathname === "/onizleme" || pathname.startsWith("/onizleme/")) {
    return NextResponse.next();
  }

  const isPreviewing = verifyPreviewToken("cookie", request.cookies.get(PREVIEW_COOKIE)?.value);
  const gate = await getSiteGate();
  // Panelde "Kapalı" ya da "Hazırlık" durumundaki diller ziyaretçiye
  // yoktur; önizleme yapan panel kullanıcısı hepsini görür.
  const locales = isPreviewing ? routing.locales : gate.liveLocales;

  // "Yakında" sayfası ziyaretçiye kendi adresinden değil, ana sayfa
  // adresinden gösterilir; doğrudan adresini yalnızca önizleme yapan
  // panel kullanıcısı açabilir.
  if (pathname === "/yakinda" || pathname.startsWith("/yakinda/")) {
    if (isPreviewing) return NextResponse.next();
    const locale = pathname.split("/")[2];
    const target = hasLocale(locales, locale) ? `/${locale}` : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Yayında olmayan bir dilin adresi: ziyaretçi, tarayıcı diline göre
  // yayındaki bir dile gider.
  const [first] = pathname.split("/").filter(Boolean);
  if (first && hasLocale(routing.locales, first) && !hasLocale(locales, first)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPreviewing && gate.comingSoon) {
    const [locale, ...rest] = pathname.split("/").filter(Boolean);
    if (locale && hasLocale(locales, locale)) {
      // Mağaza açılana kadar tek sayfa vardır: dilin ana sayfası.
      if (rest.length > 0) {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
      return NextResponse.rewrite(new URL(`/yakinda/${locale}`, request.url));
    }
    // Dil öneki olmayan adresler önce next-intl ile /<dil>/... adresine
    // gider, ardından yukarıdaki kural uygulanır.
  }

  return intlFor(locales)(request);
}

export const config = {
  // Also excludes any path with a file extension (e.g. /images/hero.jpg,
  // /favicon.ico) so static assets in /public are served untouched instead
  // of being redirected to a locale-prefixed URL. /icon and /apple-icon are
  // the generated tab and home-screen icons (src/app/icon.tsx).
  matcher: ["/((?!_next/static|_next/image|icon$|apple-icon$|.*\\..*).*)"],
};
