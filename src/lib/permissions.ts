import { z } from "zod";

/**
 * Panel bölümleri ve çalışan rollerinin bunlardaki yetkisi.
 *
 * Süper Yönetici her şeye erişir. Çalışanın (EDITOR) yetkileri bağlı olduğu
 * rolden gelir: her bölüm için "Yok", "Görüntüle" ya da "Düzenle".
 * Kullanıcılar, roller, işlem kaydı ve Yakında ayarı yalnızca Süper
 * Yöneticiye açıktır; Panel, Hesabım ve Yardım herkese açıktır.
 */

export const SECTIONS = ["products", "categories", "inquiries", "content", "languages"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  products: "Ürünler",
  categories: "Kategoriler",
  inquiries: "Talepler",
  content: "Site Metinleri",
  languages: "Diller",
};

export const LEVELS = ["none", "view", "edit"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  none: "Yok",
  view: "Görüntüle",
  edit: "Düzenle",
};

export type Permissions = Record<Section, Level>;

const levelSchema = z.enum(LEVELS);

/** Veritabanındaki JSON'u okur; eksik ya da bozuk bölüm "Yok" sayılır. */
export function parsePermissions(raw: unknown): Permissions {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    SECTIONS.map((section) => {
      const parsed = levelSchema.safeParse(source[section]);
      return [section, parsed.success ? parsed.data : "none"];
    })
  ) as Permissions;
}

export const FULL_ACCESS: Permissions = Object.fromEntries(
  SECTIONS.map((section) => [section, "edit"])
) as Permissions;

const RANK: Record<Level, number> = { none: 0, view: 1, edit: 2 };

export function allows(permissions: Permissions, section: Section, needed: Exclude<Level, "none">) {
  return RANK[permissions[section]] >= RANK[needed];
}
