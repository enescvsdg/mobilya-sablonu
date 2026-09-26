import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalArticle } from "@/components/site/legal-article";
import { buildPageMetadata } from "@/lib/seo";
import { formatLegalDate, siteConfig } from "@/lib/site-config";

const PATH = "/kullanim-sartlari";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("title"),
    description: t("intro"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  const email = siteConfig.email;

  return (
    <LegalArticle
      title={t("title")}
      lastUpdated={t("lastUpdated", { date: formatLegalDate(locale) })}
      intro={t("intro")}
      sections={[
        { title: t("scopeTitle"), text: t("scopeText") },
        { title: t("ipTitle"), text: t("ipText") },
        { title: t("productTitle"), text: t("productText") },
        { title: t("priceTitle"), text: t("priceText") },
        { title: t("liabilityTitle"), text: t("liabilityText") },
        { title: t("linksTitle"), text: t("linksText") },
        { title: t("changesTitle"), text: t("changesText") },
        { title: t("lawTitle"), text: t("lawText") },
        { title: t("contactTitle"), text: t("contactText", { email }) },
      ]}
    />
  );
}
