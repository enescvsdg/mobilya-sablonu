import "server-only";
import { cache } from "react";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";

export type ContentField = "title" | "body" | "image";

export type ContentBlock = {
  key: string;
  /** Admin panelinde görünen başlık. */
  label: string;
  hint: string;
  fields: ContentField[];
  /** Panelden boş bırakılırsa kullanılacak çeviri anahtarları. */
  fallback: {
    namespace: string;
    title?: string;
    /** Birden fazla anahtar verilirse paragraflar olarak birleştirilir. */
    body?: string[];
  };
  defaultImage?: string;
};

/**
 * Panelden düzenlenebilen metin blokları.
 *
 * Boş bırakılan alanlar `messages/<dil>.json` içindeki hazır metne düşer;
 * yani panel hiç kullanılmasa da site eksiksiz görünür.
 */
export const CONTENT_BLOCKS: ContentBlock[] = [
  {
    key: "home_hero",
    label: "Ana sayfa — Açılış bölümü",
    hint: "Sitenin ilk ekranı: büyük başlık, alt metin ve arka plan görseli.",
    fields: ["title", "body", "image"],
    fallback: { namespace: "Home", title: "heroTitle", body: ["heroSubtitle"] },
    defaultImage: "/images/hero-salon.jpg",
  },
  {
    key: "home_craft",
    label: "Ana sayfa — El işçiliği bandı",
    hint: "Atölye görseli ve yanındaki kısa el işçiliği metni.",
    fields: ["title", "body", "image"],
    fallback: { namespace: "Home", title: "craftTitle", body: ["craftText"] },
    defaultImage: "/images/atolye-detay.jpg",
  },
  {
    key: "home_quote",
    label: "Ana sayfa — Alıntı bandı",
    hint: "Tam genişlikte görselin üzerindeki tek cümlelik alıntı.",
    fields: ["body", "image"],
    fallback: { namespace: "Home", body: ["quoteText"] },
    defaultImage: "/images/malzeme-doku-kadife.jpg",
  },
  {
    key: "about_intro",
    label: "Hakkımızda — Giriş",
    hint: "Sayfanın başlığı ve ilk paragrafı (marka hikâyesi).",
    fields: ["title", "body"],
    fallback: { namespace: "About", title: "title", body: ["storyP1"] },
  },
  {
    key: "about_workshop",
    label: "Hakkımızda — Atölye",
    hint: "Eskiz görseli ve yanındaki atölye paragrafı.",
    fields: ["body", "image"],
    fallback: { namespace: "About", body: ["storyP2"] },
    defaultImage: "/images/marka-hikayesi-eskiz.jpg",
  },
  {
    key: "about_craft",
    label: "Hakkımızda — El işçiliği sözümüz",
    hint: "Koyu marka renkli bölüm. Boş satır bırakarak paragraf ayırabilirsin.",
    fields: ["title", "body", "image"],
    fallback: {
      namespace: "About",
      title: "craftTitle",
      body: ["craftText", "storyP3"],
    },
    defaultImage: "/images/atolye-detay.jpg",
  },
];

export function getContentBlock(key: string) {
  return CONTENT_BLOCKS.find((block) => block.key === key);
}

export type ResolvedContent = {
  title: string;
  /** Paragraflara bölünmüş gövde metni. */
  paragraphs: string[];
  imageUrl: string;
};

/**
 * Bir istekte kaç blok okunursa okunsun tek sorgu çalışsın diye React
 * `cache` ile sarılıdır.
 */
const loadTranslations = cache(async (locale: string) => {
  const rows = await prisma.siteContentTranslation.findMany({
    where: { languageCode: locale },
    include: { siteContent: { select: { key: true } } },
  });

  return new Map(rows.map((row) => [row.siteContent.key, row]));
});

function toParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function getContent(
  key: string,
  locale: string
): Promise<ResolvedContent> {
  const block = getContentBlock(key);
  if (!block) {
    throw new Error(`Tanımsız içerik bloğu: ${key}`);
  }

  const [stored, t] = await Promise.all([
    loadTranslations(locale).then((map) => map.get(key)),
    getTranslations({ locale, namespace: block.fallback.namespace }),
  ]);

  const storedTitle = stored?.title?.trim();
  const storedBody = stored?.body?.trim();

  const title =
    storedTitle || (block.fallback.title ? t(block.fallback.title) : "");

  const paragraphs = storedBody
    ? toParagraphs(storedBody)
    : (block.fallback.body ?? []).map((messageKey) => t(messageKey));

  return {
    title,
    paragraphs,
    imageUrl: stored?.imageUrl?.trim() || block.defaultImage || "",
  };
}

/** Admin ekranı için: her blok ve dilin kayıtlı (ham) değerleri. */
export async function getStoredContent() {
  const contents = await prisma.siteContent.findMany({
    include: { translations: true },
  });

  const map = new Map<string, Map<string, { title: string; body: string; imageUrl: string }>>();

  for (const content of contents) {
    map.set(
      content.key,
      new Map(
        content.translations.map((translation) => [
          translation.languageCode,
          {
            title: translation.title ?? "",
            body: translation.body ?? "",
            imageUrl: translation.imageUrl ?? "",
          },
        ])
      )
    );
  }

  return map;
}
