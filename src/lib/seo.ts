import type { Metadata } from "next";

import { brand } from "@/config/brand";
import { routing } from "@/i18n/routing";
import { getLiveLocales } from "@/lib/languages";

export const SITE_NAME = brand.name;

/** OG/Twitter `locale` alanı için ISO 639-1 → BCP 47 karşılıkları. */
export const OG_LOCALES: Record<string, string> = {
  tr: "tr_TR",
  en: "en_US",
  ru: "ru_RU",
  ar: "ar_AR",
  de: "de_DE",
  fr: "fr_FR",
  fa: "fa_IR",
  az: "az_AZ",
  es: "es_ES",
  it: "it_IT",
};

/**
 * Varsayılan paylaşım görseli. `src/app/og.png/route.tsx` tarafından
 * üretilir; yol noktalı olduğu için proxy matcher'ı tarafından es geçilir
 * ve dile göre yönlendirilmez.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Vercel önizleme/üretim dağıtımlarında otomatik sağlanır
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string) {
  // Supabase Storage gibi harici kaynaklardan gelen URL'ler zaten mutlaktır.
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Bir sayfanın yayındaki dillerdeki karşılıklarını hreflang için üretir.
 * `pathByLocale` verilmezse aynı yol tüm dillerde kullanılır (ör. /hakkimizda).
 * Panelde yayında olmayan diller (Kapalı, Hazırlık) listelenmez.
 */
export async function buildLanguageAlternates(
  path: string,
  pathByLocale?: Partial<Record<string, string>>
) {
  const languages: Record<string, string> = {};
  for (const locale of await getLiveLocales()) {
    // `pathByLocale` verildiyse yalnızca o dilde çevirisi olan sayfalar için
    // hreflang üretilir; aksi halde var olmayan bir URL'e işaret ederdik.
    // Ana sayfada yol boş string'tir; bu yüzden yalnızca tanımsızlık atlanır.
    const localePath = pathByLocale ? pathByLocale[locale] : path;
    if (localePath == null) continue;
    languages[locale] = absoluteUrl(`/${locale}${localePath}`);
  }
  return languages;
}

export async function buildAlternates(
  locale: string,
  path: string,
  pathByLocale?: Partial<Record<string, string>>
) {
  const languages = await buildLanguageAlternates(path, pathByLocale);
  const canonical = languages[locale] ?? absoluteUrl(`/${locale}${path}`);

  return {
    canonical,
    languages: {
      ...languages,
      "x-default": languages[routing.defaultLocale] ?? canonical,
    },
  };
}

/**
 * Bir alt sayfanın metadata'sını tek yerden üretir: canonical + hreflang,
 * Open Graph ve Twitter kartı. Kök layout'taki Twitter/OG değerleri aksi
 * halde alt sayfalarda olduğu gibi kalır, bu yüzden hepsi birlikte yazılır.
 */
export async function buildPageMetadata({
  locale,
  path,
  title,
  description,
  pathByLocale,
  images,
}: {
  locale: string;
  path: string;
  title: string;
  description?: string;
  pathByLocale?: Partial<Record<string, string>>;
  images?: { url: string; alt?: string }[];
}): Promise<Metadata> {
  const alternates = await buildAlternates(locale, path, pathByLocale);
  const hasImages = images != null && images.length > 0;
  // Layout'taki şablon başlığın sonuna marka adını ekler. Panelde SEO
  // başlığına marka zaten yazılmışsa ikinci kez eklenmez.
  const brandedTitle = title.trimEnd().endsWith(SITE_NAME) ? { absolute: title } : title;

  return {
    title: brandedTitle,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      ...(hasImages ? { images } : {}),
    },
    twitter: {
      title,
      description,
      ...(hasImages ? { images: images.map((image) => image.url) } : {}),
    },
  };
}

/**
 * Arama sonucunda sayfanın üstünde görünen yol (Ana Sayfa › Koleksiyonlar
 * › …). Yollar dil önekiyle verilir.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
