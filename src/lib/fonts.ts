import { IBM_Plex_Sans_Arabic, Montserrat, Playfair_Display, Reem_Kufi } from "next/font/google";

/**
 * Sitenin yazı tipleri. Hem ana site hem "Yakında" sayfası kendi kök
 * layout'una sahip olduğundan tanımlar burada, tek yerde durur.
 */
export const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});

export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

/**
 * Arapça: başlıklarda geometrik Kufi (zarif başlıklara uyar), metinde
 * sade bir Arapça yazı tipi. Önceden yüklenmez; tarayıcı yalnızca sayfada
 * Arapça harf varsa indirir (unicode-range).
 */
export const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  subsets: ["arabic"],
  preload: false,
});

export const plexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  preload: false,
});

/** Kök <html> öğesine eklenen yazı tipi değişkenleri. */
export const fontVariables = [
  playfairDisplay.variable,
  montserrat.variable,
  reemKufi.variable,
  plexSansArabic.variable,
].join(" ");
