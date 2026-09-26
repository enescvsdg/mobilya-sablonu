import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { getDirection, routing } from "@/i18n/routing";
import { brandCssVariables } from "@/lib/brand-theme";
import { fontVariables } from "@/lib/fonts";
import { ImageGuard } from "@/components/site/image-guard";
import "../../globals.css";

/**
 * "Yakında" sayfasının kök layout'u. Ana sitenin menüsü ve alt bilgisi
 * olmadan, tam ekran sahneyi taşır. Ziyaretçi bu sayfayı kendi adresinden
 * değil, proxy'nin yönlendirmesiyle dilin ana sayfa adresinden görür
 * (src/proxy.ts).
 *
 * `dynamicParams = false` bilerek yok: sayfa sonradan yeniden üretilirken
 * (ör. panelde `revalidatePath("/", "layout")`) Next.js /yakinda/tr yolunu
 * [locale]/[...rest] rotasına düşürüp 404 üretiyor. Geçersiz dil zaten
 * aşağıda notFound() ile elenir.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default async function ComingSoonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${fontVariables} h-full antialiased`}
      style={brandCssVariables}
    >
      <body className="h-full bg-[#050505] font-body text-surface-warm" data-image-guard="">
        <ImageGuard />
        {children}
      </body>
    </html>
  );
}
