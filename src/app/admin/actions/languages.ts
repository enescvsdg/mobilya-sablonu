"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import { requireEdit } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { isBuildSupported } from "@/lib/languages";
import { routing } from "@/i18n/routing";

/**
 * Sitenin ana dili (yönlendirmenin varsayılanı, çevirilerin kaynağı)
 * sabittir: her zaman yayındadır ve silinemez. Proxy ve site haritası da
 * onu her zaman yayında sayar (src/lib/site-gate.ts, getLiveLocales).
 */
function isMainLanguage(language: { code: string; isDefault: boolean }) {
  return language.code === routing.defaultLocale || language.isDefault;
}

export type LanguageFormState = { error?: string; success?: boolean } | undefined;

// ISO 639-1 (tr) veya bölgeli kod (pt-BR) — URL öneki olarak kullanılır.
const CODE_PATTERN = /^[a-z]{2}(-[A-Za-z]{2,4})?$/;

function revalidateLanguages() {
  revalidatePath("/admin/languages");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/content");
  revalidatePath("/admin/ceviriler");
  revalidatePath("/admin");
  // Dil listesi navbar'da, hreflang'de ve site haritasında kullanıldığı için
  // tüm site yenilenmeli; Yakında sayfaları önceden üretilir.
  revalidatePath("/", "layout");
  revalidatePath("/yakinda/[locale]", "page");
}

export async function createLanguageAction(
  _prevState: LanguageFormState,
  formData: FormData
): Promise<LanguageFormState> {
  await requireEdit("languages");

  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const nativeName = String(formData.get("nativeName") ?? "").trim() || name;

  if (!CODE_PATTERN.test(code)) {
    return { error: "Dil kodu 'tr', 'en' ya da 'pt-BR' biçiminde olmalı." };
  }
  if (!name) {
    return { error: "Dil adı zorunlu." };
  }

  const existing = await prisma.language.findUnique({ where: { code } });
  if (existing) {
    return { error: `"${code}" kodu zaten kayıtlı.` };
  }

  const last = await prisma.language.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.language.create({
    data: {
      code,
      name,
      nativeName,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      // Yeni dil, çevirileri girilene kadar yayına alınmaz.
      isActive: false,
    },
  });
  await logActivity("language.create", `Dil ekledi: ${name} (${code})`);

  revalidateLanguages();
  return { success: true };
}

export async function updateLanguageAction(
  _prevState: LanguageFormState,
  formData: FormData
): Promise<LanguageFormState> {
  await requireEdit("languages");

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const nativeName = String(formData.get("nativeName") ?? "").trim() || name;

  if (!name) {
    return { error: "Dil adı zorunlu." };
  }

  await prisma.language.update({
    where: { code },
    data: { name, nativeName },
  });
  await logActivity("language.update", `Dili güncelledi: ${name} (${code})`);

  revalidateLanguages();
  return { success: true };
}

/**
 * "Yayına al" / "Yayından kaldır". Yayındaki dil ziyaretçiye açıktır: dil
 * menüsünde görünür, site haritasına ve hreflang'e girer. Yayından kalkan
 * dilin adresleri ziyaretçiyi yayındaki bir dile yönlendirir; çeviriler
 * silinmez.
 */
export async function toggleLanguageActiveAction(
  code: string,
  isActive: boolean
): Promise<ActionResult> {
  await requireEdit("languages");

  const language = await prisma.language.findUnique({ where: { code } });
  if (!language) return { error: "Dil bulunamadı — sayfayı yenileyin." };
  if (!isActive && isMainLanguage(language)) {
    return { error: "Türkçe sitenin ana dilidir; yayından kaldırılamaz." };
  }
  if (isActive && !isBuildSupported(code)) {
    return { error: "Bu dilin arayüz çevirisi yok; yayına alınamaz." };
  }

  // Yayına alınan dil hazırlıktan çıkar; yayından kalkan dil de kapanır.
  await prisma.language.update({ where: { code }, data: { isActive, isPreparing: false } });
  await logActivity(
    "language.toggle",
    `${isActive ? "Dili yayına aldı" : "Dili yayından kaldırdı"}: ${language.name} (${code})`
  );
  revalidateLanguages();
}

/**
 * "Hazırlığa al": dil sitede kapalı kalır, panel formlarında ve Eksik
 * Çeviriler'de alanları açılır; çeviriler önceden hazırlanır.
 */
export async function setLanguagePreparingAction(
  code: string,
  isPreparing: boolean
): Promise<ActionResult> {
  await requireEdit("languages");

  const language = await prisma.language.findUnique({ where: { code } });
  if (!language) return { error: "Dil bulunamadı — sayfayı yenileyin." };
  if (language.isActive) return { error: "Bu dil zaten yayında." };
  if (isPreparing && !isBuildSupported(code)) {
    return { error: "Bu dilin arayüz çevirisi yok; hazırlığa alınamaz." };
  }

  await prisma.language.update({ where: { code }, data: { isPreparing } });
  await logActivity(
    "language.prepare",
    `${isPreparing ? "Dili hazırlığa aldı" : "Dili hazırlıktan çıkardı"}: ${language.name} (${code})`
  );
  revalidateLanguages();
}

export async function moveLanguageAction(code: string, direction: "up" | "down") {
  await requireEdit("languages");

  const languages = await prisma.language.findMany({ orderBy: { sortOrder: "asc" } });
  const index = languages.findIndex((language) => language.code === code);
  const swapWith = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapWith < 0 || swapWith >= languages.length) return;

  // sortOrder değerleri seyrek olabilir; sırayı 0..n-1 olarak yeniden yazarız.
  const reordered = [...languages];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  await prisma.$transaction(
    reordered.map((language, order) =>
      prisma.language.update({ where: { code: language.code }, data: { sortOrder: order } })
    )
  );

  revalidateLanguages();
}

export async function deleteLanguageAction(code: string): Promise<ActionResult> {
  await requireEdit("languages");

  const language = await prisma.language.findUnique({ where: { code } });
  if (language && isMainLanguage(language)) {
    return { error: "Türkçe sitenin ana dilidir; silinemez." };
  }

  try {
    // Çeviriler cascade ile silinir; talepler (Inquiry) Restrict olduğu için
    // o dilde talep varsa silme engellenir.
    await prisma.language.delete({ where: { code } });
  } catch {
    return {
      error: "Bu dil silinemiyor — bu dilde gelmiş talepler var. Dili yayından kaldırabilirsin.",
    };
  }
  await logActivity("language.delete", `Dili sildi: ${code}`);

  revalidateLanguages();
}
