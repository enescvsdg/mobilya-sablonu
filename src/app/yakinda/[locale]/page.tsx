import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CurtainStage } from "@/components/coming-soon/curtain-stage";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappNumber } from "@/lib/site-settings";
import { whatsappLink } from "@/lib/whatsapp";
import { DEFAULT_OG_IMAGE, OG_LOCALES, SITE_NAME, buildAlternates, getSiteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ComingSoon" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { absolute: title },
    description,
    applicationName: SITE_NAME,
    // Sayfa dilin ana sayfa adresinden sunulur; /yakinda/... hiç dizine girmez.
    alternates: await buildAlternates(locale, ""),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? locale,
      title,
      description,
      url: `/${locale}`,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ComingSoon" });
  const tContact = await getTranslations({ locale, namespace: "Contact" });
  const whatsappNumber = await getWhatsappNumber();

  return (
    <CurtainStage
      title={t("title")}
      instagramLabel={t("instagram")}
      instagramHandle={siteConfig.instagramHandle}
      instagramUrl={siteConfig.instagramUrl}
      whatsappLabel={tContact("whatsapp")}
      whatsappUrl={
        whatsappNumber ? whatsappLink(whatsappNumber, tContact("whatsappMessage")) : null
      }
    />
  );
}
