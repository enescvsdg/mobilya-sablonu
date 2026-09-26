import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getLiveLocales } from "@/lib/languages";
import { getSiteSettings } from "@/lib/site-settings";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo";

// Her istekte üretilir: panelden eklenen ürünler ve "Yakında" modunun
// açılıp kapanması hemen yansısın. Site küçük, harita ucuz bir sorgudur.
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/koleksiyonlar",
  "/hakkimizda",
  "/iletisim",
  "/gizlilik-politikasi",
  "/kullanim-sartlari",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  // Yakında modunda ziyaretçiye yalnızca dillerin ana sayfası açıktır.
  const { comingSoon } = await getSiteSettings();
  const staticPaths = comingSoon ? [""] : STATIC_PATHS;
  // Panelde yayında olmayan diller (Kapalı, Hazırlık) haritada yer almaz.
  const liveLocales = await getLiveLocales();
  const isLive = (translation: { languageCode: string }) =>
    liveLocales.includes(translation.languageCode);

  for (const path of staticPaths) {
    const languages = await buildLanguageAlternates(path);
    for (const locale of liveLocales) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.7,
        alternates: { languages },
      });
    }
  }

  if (comingSoon) return entries;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      include: { translations: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: {
        translations: true,
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { url: true } },
      },
    }),
  ]);

  for (const category of categories) {
    const translations = category.translations.filter(isLive);
    const pathByLocale = Object.fromEntries(
      translations.map((t) => [t.languageCode, `/koleksiyonlar/${t.slug}`])
    );
    const languages = await buildLanguageAlternates("/koleksiyonlar", pathByLocale);
    for (const translation of translations) {
      entries.push({
        url: absoluteUrl(`/${translation.languageCode}/koleksiyonlar/${translation.slug}`),
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  }

  for (const product of products) {
    const translations = product.translations.filter(isLive);
    const pathByLocale = Object.fromEntries(
      translations.map((t) => [t.languageCode, `/urun/${t.slug}`])
    );
    const languages = await buildLanguageAlternates("/urun", pathByLocale);
    // Görseller Google Görseller'de ürün sayfasıyla birlikte bulunsun.
    const images = product.images.map((image) => absoluteUrl(image.url));
    for (const translation of translations) {
      entries.push({
        url: absoluteUrl(`/${translation.languageCode}/urun/${translation.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: { languages },
        ...(images.length > 0 ? { images } : {}),
      });
    }
  }

  return entries;
}
