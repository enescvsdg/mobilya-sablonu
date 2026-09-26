import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
};

/**
 * Derlemede desteklenen dil kodları (arayüz çevirisi hazır olanlar).
 *
 * next-intl'in yönlendirmesi (URL öneki, `generateStaticParams`, istemci
 * tarafı gezinme) derleme zamanında sabit bir liste ister; bu yüzden
 * `routing.locales` veritabanından okunamaz. Veritabanındaki Language
 * tablosu ise dilin durumunu belirler:
 *   - Yayında (isActive): ziyaretçiye açık, site haritasında ve hreflang'de.
 *   - Hazırlık (isPreparing): sitede kapalı, panel formlarında alanları açık.
 *   - Kapalı: ikisi de değil; dil yalnızca Diller ekranında görünür.
 *
 * Listede olmayan yeni bir dil için:
 *   1. `src/i18n/routing.ts` içindeki `locales` dizisine kodu ekle
 *   2. `messages/<kod>.json` dosyasını oluştur
 *   3. Admin > Diller ekranından dili ekleyip aktifleştir
 */
export const BUILD_SUPPORTED_LOCALES: readonly string[] = routing.locales;

export function isBuildSupported(code: string) {
  return BUILD_SUPPORTED_LOCALES.includes(code);
}

/** Dil tablosu boşsa (ör. seed çalışmadıysa) site yine de açılmalı. */
const FALLBACK_LANGUAGE: LanguageOption = {
  code: routing.defaultLocale,
  name: routing.defaultLocale.toUpperCase(),
  nativeName: routing.defaultLocale.toUpperCase(),
};

/**
 * Admin formlarında çeviri alanı açılacak diller: yayında ya da hazırlıkta
 * olan ve derlemede de desteklenen diller.
 */
export async function getEditableLanguages(): Promise<LanguageOption[]> {
  const languages = await prisma.language.findMany({
    where: { OR: [{ isActive: true }, { isPreparing: true }] },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true, nativeName: true },
  });

  const usable = languages.filter((language) => isBuildSupported(language.code));
  return usable.length > 0 ? usable : [FALLBACK_LANGUAGE];
}

/** Sadece dil kodları — sunucu action'larında çeviri döngüsü için. */
export async function getEditableLanguageCodes(): Promise<string[]> {
  return (await getEditableLanguages()).map((language) => language.code);
}

/**
 * Ziyaretçiye açık (yayındaki) diller, `routing.locales` sırasıyla. Site
 * haritası, hreflang ve Open Graph yalnızca bunları listeler; proxy de
 * aynı ayarı kendi okur (src/lib/site-gate.ts). Varsayılan dil her zaman
 * dahildir. İstek başına bir kez okunur.
 */
export const getLiveLocales = cache(async (): Promise<string[]> => {
  let live: string[] = [];
  try {
    const rows = await prisma.language.findMany({
      where: { isActive: true },
      select: { code: true },
    });
    live = rows.map((row) => row.code);
  } catch (error) {
    console.error("[diller] Yayındaki diller okunamadı:", error);
  }
  return routing.locales.filter(
    (locale) => locale === routing.defaultLocale || live.includes(locale)
  );
});
