import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalArticle } from "@/components/site/legal-article";
import { buildPageMetadata } from "@/lib/seo";
import { formatLegalDate, siteConfig } from "@/lib/site-config";

const PATH = "/gizlilik-politikasi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("title"),
    description: t("intro"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  const email = siteConfig.email;

  return (
    <LegalArticle
      title={t("title")}
      lastUpdated={t("lastUpdated", { date: formatLegalDate(locale) })}
      intro={t("intro")}
      sections={[
        { title: t("controllerTitle"), text: t("controllerText", { email }) },
        { title: t("dataTitle"), text: t("dataText") },
        { title: t("purposeTitle"), text: t("purposeText") },
        { title: t("legalBasisTitle"), text: t("legalBasisText") },
        { title: t("sharingTitle"), text: t("sharingText") },
        { title: t("retentionTitle"), text: t("retentionText") },
        { title: t("cookiesTitle"), text: t("cookiesText") },
        { title: t("rightsTitle"), text: t("rightsText", { email }) },
      ]}
    />
  );
}
