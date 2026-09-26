/**
 * Otomatik çevirinin hangi alanları kapsadığı ve bir alanın ne zaman
 * "çevrilmemiş" sayıldığı. Hem panel formları (tarayıcı) hem sunucu
 * kullanır.
 */

export type TranslatableKind = "product" | "category" | "content";

/**
 * Çevirinin kaynağı her zaman Türkçedir; dil sırası ya da varsayılan dil
 * panelden değiştirilse de düğmeler "Türkçeden" çevirir.
 */
export const TRANSLATION_SOURCE = "tr";

/** Çevrilen alanlar ve sitede nerede göründükleri; model bağlamı buradan anlar. */
export const TRANSLATABLE_FIELDS = {
  product: {
    name: "product name",
    shortDescription: "one-line summary shown on the product card",
    description: "product description",
    materialsText: "materials and craftsmanship note",
    seoTitle: "SEO page title",
    seoDescription: "SEO meta description",
  },
  category: {
    name: "collection (category) name",
    description: "collection description",
    seoTitle: "SEO page title",
    seoDescription: "SEO meta description",
  },
  content: {
    title: "section heading on the website",
    body: "section text on the website (blank lines separate paragraphs)",
  },
} as const satisfies Record<TranslatableKind, Record<string, string>>;

export function translatableFieldNames(kind: TranslatableKind): string[] {
  return Object.keys(TRANSLATABLE_FIELDS[kind]);
}

/**
 * Alan boşsa çevrilmemiştir. İsim alanı boş kaydedilince Türkçe isim
 * kopyalanır (ürün ve kategori kaydı); Türkçesiyle aynı isim de
 * çevrilmemiş sayılır.
 */
export function needsTranslation(
  field: string,
  value: string | null | undefined,
  sourceValue: string
) {
  const text = (value ?? "").trim();
  return text === "" || (field === "name" && text === sourceValue.trim());
}

/**
 * Ürünün varyant adları ve görsel alt metinleri de çeviriye girer; alan
 * adları kaydın kimliğini taşır (variant_<id>, alt_<id>). Türkçeleri
 * varyantın/görselin kendi sütunundadır.
 */
export const VARIANT_FIELD_PREFIX = "variant_";
export const ALT_FIELD_PREFIX = "alt_";

/** Modelin bağlamı anlaması için alanın sitedeki yeri. */
export function describeField(kind: TranslatableKind, name: string): string {
  if (name.startsWith(VARIANT_FIELD_PREFIX)) {
    return "fabric, colour or finish option of the product (short label)";
  }
  if (name.startsWith(ALT_FIELD_PREFIX)) {
    return "alt text describing a product photo (accessibility and image search)";
  }
  const fields: Record<string, string> = TRANSLATABLE_FIELDS[kind];
  return fields[name] ?? name;
}
