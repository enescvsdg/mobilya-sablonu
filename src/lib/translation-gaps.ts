import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getContentBlock } from "@/lib/site-content";
import { slugify } from "@/lib/slugify";
import { translateFields, type FieldTexts } from "@/lib/translation";
import {
  ALT_FIELD_PREFIX,
  needsTranslation,
  translatableFieldNames,
  TRANSLATION_SOURCE,
  VARIANT_FIELD_PREFIX,
  type TranslatableKind,
} from "@/lib/translation-rules";

/**
 * "Eksik çeviriler" ekranı: Türkçesi yazılmış ama diğer dillerde boş kalan
 * alanları bulur ve Gemini ile doldurur. Dolu alanlara dokunulmaz.
 */

export type TranslationGap = {
  kind: TranslatableKind;
  /** Ürün/kategori kimliği ya da site metni bloğunun anahtarı. */
  id: string;
  /** Türkçe isim ya da blok başlığı. */
  label: string;
  editHref: string;
  /** Dil kodu → eksik alanlar. */
  missing: Record<string, string[]>;
};

type Row = { languageCode: string } & Partial<Record<string, string | null>>;

/** Türkçesi dolu olup hedef dilde çevrilmemiş alanlar. */
function missingFields(fields: string[], rows: Row[], source: Row, targets: string[]) {
  const missing: Record<string, string[]> = {};
  for (const code of targets) {
    const row = rows.find((candidate) => candidate.languageCode === code);
    const gaps = fields.filter((field) => {
      const sourceValue = source[field]?.trim() ?? "";
      return sourceValue !== "" && needsTranslation(field, row?.[field], sourceValue);
    });
    if (gaps.length > 0) missing[code] = gaps;
  }
  return missing;
}

type MediaProduct = {
  variants: { id: string; name: string; translations: { languageCode: string; name: string }[] }[];
  images: {
    id: string;
    altText: string | null;
    translations: { languageCode: string; altText: string }[];
  }[];
};

/** Ürün sorgularında varyant ve görsellerin çevirileriyle birlikte gelmesi için. */
const MEDIA_INCLUDE = {
  variants: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
  images: {
    include: { translations: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.ProductInclude;

/**
 * Varyant adları ve görsel alt metinlerinden hedef dillerde boş olanlar.
 * `source` alan adı → Türkçe metin, `missing` dil → alan adları.
 */
function missingMedia(product: MediaProduct, targets: string[]) {
  const source: FieldTexts = {};
  const missing: Record<string, string[]> = {};
  const items = [
    ...product.variants.map((variant) => ({
      key: VARIANT_FIELD_PREFIX + variant.id,
      text: variant.name,
      translations: variant.translations.map((t) => ({ code: t.languageCode, text: t.name })),
    })),
    ...product.images.map((image) => ({
      key: ALT_FIELD_PREFIX + image.id,
      text: image.altText ?? "",
      translations: image.translations.map((t) => ({ code: t.languageCode, text: t.altText })),
    })),
  ];
  for (const item of items) {
    if (!item.text.trim()) continue;
    source[item.key] = item.text.trim();
    for (const code of targets) {
      const translated = item.translations.find((t) => t.code === code)?.text.trim();
      if (!translated) (missing[code] ??= []).push(item.key);
    }
  }
  return { source, missing };
}

function mergeMissing(...parts: Record<string, string[]>[]) {
  const merged: Record<string, string[]> = {};
  for (const part of parts) {
    for (const [code, fields] of Object.entries(part)) {
      merged[code] = [...(merged[code] ?? []), ...fields];
    }
  }
  return merged;
}

/** Kaynak (Türkçe) ve hedef diller; Türkçe kapalıysa çeviri yapılmaz. */
function sourceAndTargets(languageCodes: string[]) {
  if (!languageCodes.includes(TRANSLATION_SOURCE)) return null;
  return {
    sourceCode: TRANSLATION_SOURCE,
    targets: languageCodes.filter((code) => code !== TRANSLATION_SOURCE),
  };
}

function contentFields(key: string) {
  const block = getContentBlock(key);
  if (!block) return null;
  return {
    block,
    fields: translatableFieldNames("content").filter((field) =>
      block.fields.includes(field as "title" | "body")
    ),
  };
}

export async function findTranslationGaps(
  kinds: TranslatableKind[],
  languageCodes: string[]
): Promise<TranslationGap[]> {
  const languages = sourceAndTargets(languageCodes);
  if (!languages || languages.targets.length === 0) return [];
  const { sourceCode, targets } = languages;
  const gaps: TranslationGap[] = [];

  if (kinds.includes("product")) {
    const products = await prisma.product.findMany({
      include: { translations: true, ...MEDIA_INCLUDE },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    for (const product of products) {
      const source = product.translations.find((row) => row.languageCode === sourceCode);
      if (!source) continue;
      const missing = mergeMissing(
        missingFields(translatableFieldNames("product"), product.translations, source, targets),
        missingMedia(product, targets).missing
      );
      if (Object.keys(missing).length > 0) {
        gaps.push({
          kind: "product",
          id: product.id,
          label: source.name,
          editHref: `/admin/products/${product.id}`,
          missing,
        });
      }
    }
  }

  if (kinds.includes("category")) {
    const categories = await prisma.category.findMany({
      include: { translations: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    for (const category of categories) {
      const source = category.translations.find((row) => row.languageCode === sourceCode);
      if (!source) continue;
      const missing = missingFields(
        translatableFieldNames("category"),
        category.translations,
        source,
        targets
      );
      if (Object.keys(missing).length > 0) {
        gaps.push({
          kind: "category",
          id: category.id,
          label: source.name,
          editHref: `/admin/categories/${category.id}`,
          missing,
        });
      }
    }
  }

  if (kinds.includes("content")) {
    const contents = await prisma.siteContent.findMany({ include: { translations: true } });
    for (const content of contents) {
      const definition = contentFields(content.key);
      const source = content.translations.find((row) => row.languageCode === sourceCode);
      if (!definition || !source) continue;
      const missing = missingFields(definition.fields, content.translations, source, targets);
      if (Object.keys(missing).length > 0) {
        gaps.push({
          kind: "content",
          id: content.key,
          label: definition.block.label,
          editHref: "/admin/content",
          missing,
        });
      }
    }
  }

  return gaps;
}

/** Aynı dilde başka bir kayıt kullanıyorsa sonuna -2, -3… eklenir. */
async function availableSlug(
  kind: "product" | "category",
  languageCode: string,
  base: string,
  ownerId: string
) {
  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    const taken =
      kind === "product"
        ? await prisma.productTranslation.findFirst({
            where: { languageCode, slug, productId: { not: ownerId } },
            select: { id: true },
          })
        : await prisma.categoryTranslation.findFirst({
            where: { languageCode, slug, categoryId: { not: ownerId } },
            select: { id: true },
          });
    if (!taken) return slug;
  }
}

/**
 * Tek bir kaydın eksik çevirilerini doldurur. Kayıt yoksa null döner.
 * Türkçe isimden üretilmiş adres (slug) çevrilen isimden yeniden üretilir;
 * elle girilmiş adreslere dokunulmaz. Ürünlerde `scope: "media"` yalnızca
 * varyant adlarını ve görsel alt metinlerini doldurur (ürün formu açıkken
 * formdaki alanların üzerine yazmamak için).
 */
export async function fillMissingTranslations(
  kind: TranslatableKind,
  id: string,
  languageCodes: string[],
  scope: "all" | "media" = "all"
): Promise<{ label: string; filled: number; languages: string[] } | null> {
  const languages = sourceAndTargets(languageCodes);
  if (!languages) return null;
  const { sourceCode, targets } = languages;

  if (kind === "content") {
    const content = await prisma.siteContent.findUnique({
      where: { key: id },
      include: { translations: true },
    });
    const definition = content && contentFields(content.key);
    const source = content?.translations.find((row) => row.languageCode === sourceCode);
    if (!content || !definition || !source) return null;

    const missing = missingFields(definition.fields, content.translations, source, targets);
    const translated = await translateMissing(kind, sourceCode, source, missing);

    for (const [code, texts] of Object.entries(translated)) {
      await prisma.siteContentTranslation.upsert({
        where: { siteContentId_languageCode: { siteContentId: content.id, languageCode: code } },
        update: texts,
        // Görsel her dilin satırında ayrı durur; yeni satır Türkçesininkini alır.
        create: {
          siteContentId: content.id,
          languageCode: code,
          imageUrl: source.imageUrl,
          ...texts,
        },
      });
    }
    return summary(definition.block.label, translated);
  }

  const record =
    kind === "product"
      ? await prisma.product.findUnique({
          where: { id },
          include: { translations: true, ...MEDIA_INCLUDE },
        })
      : await prisma.category.findUnique({ where: { id }, include: { translations: true } });
  const source = record?.translations.find((row) => row.languageCode === sourceCode);
  if (!record || !source) return null;

  const media =
    "variants" in record ? missingMedia(record, targets) : { source: {}, missing: {} };
  const missing = mergeMissing(
    scope === "all"
      ? missingFields(translatableFieldNames(kind), record.translations, source, targets)
      : {},
    media.missing
  );
  const translated = await translateMissing(kind, sourceCode, { ...source, ...media.source }, missing);
  const sourceSlug = slugify(source.name);

  for (const [code, allTexts] of Object.entries(translated)) {
    const texts: FieldTexts = {};
    for (const [field, text] of Object.entries(allTexts)) {
      if (field.startsWith(VARIANT_FIELD_PREFIX)) {
        const variantId = field.slice(VARIANT_FIELD_PREFIX.length);
        await prisma.productVariantTranslation.upsert({
          where: { variantId_languageCode: { variantId, languageCode: code } },
          update: { name: text },
          create: { variantId, languageCode: code, name: text },
        });
      } else if (field.startsWith(ALT_FIELD_PREFIX)) {
        const imageId = field.slice(ALT_FIELD_PREFIX.length);
        await prisma.productImageTranslation.upsert({
          where: { imageId_languageCode: { imageId, languageCode: code } },
          update: { altText: text },
          create: { imageId, languageCode: code, altText: text },
        });
      } else {
        texts[field] = text;
      }
    }
    if (Object.keys(texts).length === 0) continue;

    const row = record.translations.find((candidate) => candidate.languageCode === code);
    const name = texts.name ?? row?.name ?? source.name;
    const regenerate = texts.name !== undefined && (!row || row.slug === sourceSlug);
    const slug = regenerate
      ? await availableSlug(kind, code, slugify(name) || sourceSlug, id)
      : undefined;

    if (kind === "product") {
      await prisma.productTranslation.upsert({
        where: { productId_languageCode: { productId: id, languageCode: code } },
        update: { ...texts, ...(slug ? { slug } : {}) },
        create: { productId: id, languageCode: code, ...texts, name, slug: slug ?? sourceSlug },
      });
    } else {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_languageCode: { categoryId: id, languageCode: code } },
        update: { ...texts, ...(slug ? { slug } : {}) },
        create: { categoryId: id, languageCode: code, ...texts, name, slug: slug ?? sourceSlug },
      });
    }
  }
  return summary(source.name, translated);
}

/** Yalnızca eksik alanları çevirtir; dil kodu → alan → çeviri döner. */
async function translateMissing(
  kind: TranslatableKind,
  sourceCode: string,
  source: Row,
  missing: Record<string, string[]>
) {
  const codes = Object.keys(missing);
  if (codes.length === 0) return {};

  const fields = [...new Set(codes.flatMap((code) => missing[code]))];
  const sourceTexts: FieldTexts = Object.fromEntries(
    fields.map((field) => [field, source[field]?.trim() ?? ""])
  );
  const translated = await translateFields(kind, sourceCode, sourceTexts, codes);

  // Boş dönen çeviri yazılmaz; alan eksik kalır ve sonra yeniden denenir.
  return Object.fromEntries(
    codes
      .map((code) => [
        code,
        Object.fromEntries(
          missing[code]
            .map((field) => [field, translated[code]?.[field] ?? ""])
            .filter(([, text]) => text !== "")
        ),
      ])
      .filter(([, texts]) => Object.keys(texts).length > 0)
  ) as Record<string, FieldTexts>;
}

function summary(label: string, translated: Record<string, FieldTexts>) {
  const languages = Object.keys(translated);
  return {
    label,
    filled: languages.reduce((total, code) => total + Object.keys(translated[code]).length, 0),
    languages,
  };
}
