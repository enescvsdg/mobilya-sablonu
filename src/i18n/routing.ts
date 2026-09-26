import { defineRouting } from "next-intl/routing";

/**
 * Arayüz çevirisi (messages/<kod>.json) hazır olan diller. Hangilerinin
 * ziyaretçiye açık olduğunu panel belirler (Diller ekranı, "Yayında");
 * yayında olmayanlar proxy'de gizlenir (src/proxy.ts). İlk dördünden
 * sonrakiler "dil paketi"dir: panelden açılana kadar kapalı durur.
 */
export const routing = defineRouting({
  locales: ["tr", "en", "ru", "ar", "de", "fr", "fa", "az", "es", "it"],
  defaultLocale: "tr",
  localePrefix: "always",
  localeDetection: true,
});

/** Sağdan sola yazılan diller; sayfa bu dillerde aynalanır. */
const RTL_LOCALES: readonly string[] = ["ar", "fa"];

export function getDirection(locale: string): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
