import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getDirection, routing } from "@/i18n/routing";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { PreviewBadge } from "@/components/site/preview-badge";
import { ImageGuard } from "@/components/site/image-guard";
import { INTRO_SESSION_KEY } from "@/lib/intro-session";
import { DEFAULT_OG_IMAGE, OG_LOCALES, SITE_NAME, getSiteUrl } from "@/lib/seo";
import { brandCssVariables } from "@/lib/brand-theme";
import { fontVariables } from "@/lib/fonts";
import { getLiveLocales } from "@/lib/languages";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(getSiteUrl()),
    // Alt sayfalar yalnızca kendi başlığını döndürür, şablon markayı ekler.
    title: { default: t("title"), template: `%s | ${SITE_NAME}` },
    description: t("description"),
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? locale,
      alternateLocale: (await getLiveLocales())
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALES[l] ?? l),
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function LocaleLayout({
  children,
  intro,
  params,
}: {
  children: React.ReactNode;
  /** @intro paralel rota slotu — yalnızca ana sayfada dolu gelir. */
  intro: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: "Nav" });

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${fontVariables} h-full antialiased`}
      style={brandCssVariables}
      // Giriş animasyonu betiği boyamadan önce data-intro ekler (aşağıda).
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-surface font-body text-ink"
        data-image-guard=""
      >
        <ImageGuard />
        {/* Giriş animasyonu yalnızca oturumun ilk ziyaretinde oynar. Karar
            boyamadan önce verilmeli, yoksa tekrar gelen ziyaretçi katmanı
            bir an için görür. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_SESSION_KEY}")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.intro="off"}}catch(e){}`,
          }}
        />
        {intro}
        <NextIntlClientProvider>
          {/* Klavye/ekran okuyucu kullanıcıları menüyü baştan taramadan
              içeriğe atlayabilsin diye; yalnızca odaklanınca görünür. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-surface-warm"
          >
            {tNav("skipToContent")}
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <PreviewBadge />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
