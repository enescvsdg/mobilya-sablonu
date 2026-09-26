/**
 * Önizleme çerezlerinin adları. Tarayıcı tarafındaki önizleme şeridi de
 * okuduğu için imza kodundan (node:crypto) ayrı tutulur.
 */

/** Gerçek siteyi açan çerez; proxy doğrular. */
export const PREVIEW_COOKIE = "site_onizleme";

/**
 * Önizleme şeridinin görünmesi için tarayıcı betiğinin okuyabildiği eş
 * çerez. Yalnızca arayüz ipucudur, hiçbir yetki vermez.
 */
export const PREVIEW_HINT_COOKIE = "site_onizleme_ui";
