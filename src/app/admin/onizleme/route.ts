import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { getCurrentAdmin } from "@/lib/dal";
import { PREVIEW_LINK_TTL_SECONDS, createPreviewToken, safePreviewTarget } from "@/lib/preview";

const ADMIN_HOST_PREFIX = "admin.";

/**
 * Paneldeki "Siteyi önizle" bağlantısı. Oturum ana siteye taşınamadığı için
 * ana sitedeki /onizleme adresine bir dakikalık imzalı bir bağlantıyla
 * gidilir. Ana site adresi panelin kendi adresinden çıkarılır: admin.*
 * önekini atmak üretimde, yerelde ve (öneksiz) önizleme dağıtımlarında
 * doğru adresi verir.
 */
export async function GET(request: NextRequest) {
  // Oturum yoksa ya da hesap artık geçerli değilse girişe yönlenir.
  await getCurrentAdmin();

  const { host, protocol } = request.nextUrl;
  const siteHost = host.startsWith(ADMIN_HOST_PREFIX) ? host.slice(ADMIN_HOST_PREFIX.length) : host;

  const target = new URL(`${protocol}//${siteHost}/onizleme`);
  target.searchParams.set("t", createPreviewToken("link", PREVIEW_LINK_TTL_SECONDS));
  if (request.nextUrl.searchParams.has("yakinda")) {
    target.searchParams.set("yakinda", routing.defaultLocale);
  }
  // "Sitede önizle": önizleme açıldıktan sonra gidilecek sayfa (ör. taslak ürün).
  const page = safePreviewTarget(request.nextUrl.searchParams.get("hedef"));
  if (page) target.searchParams.set("hedef", page);
  return NextResponse.redirect(target);
}
