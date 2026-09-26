import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Hero } from "@/components/site/hero";
import { FeaturedCollections } from "@/components/site/featured-collections";
import { CraftBand } from "@/components/site/craft-band";
import { FeaturedProducts } from "@/components/site/featured-products";
import { QuoteBand } from "@/components/site/quote-band";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, absoluteUrl, buildAlternates, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappNumber } from "@/lib/site-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    // Ana sayfa layout'un varsayılan başlığını kullanır (şablon uygulanmaz).
    title: { absolute: t("title") },
    description: t("description"),
    alternates: await buildAlternates(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const whatsappNumber = await getWhatsappNumber();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FurnitureStore",
          "@id": `${getSiteUrl()}/#organization`,
          name: SITE_NAME,
          description: t("description"),
          url: absoluteUrl(`/${locale}`),
          image: absoluteUrl("/og.png"),
          email: siteConfig.email,
          ...(whatsappNumber ? { telephone: `+${whatsappNumber}` } : {}),
          sameAs: [siteConfig.instagramUrl],
          address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.address.street,
            addressLocality: siteConfig.address.locality,
            addressRegion: siteConfig.address.region,
            addressCountry: siteConfig.address.countryCode,
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: siteConfig.address.lat,
            longitude: siteConfig.address.lng,
          },
        }}
      />
      <Hero />
      <FeaturedCollections />
      <CraftBand />
      <FeaturedProducts />
      <QuoteBand />
    </>
  );
}
