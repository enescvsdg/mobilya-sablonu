"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/action-result";
import { requireEdit } from "@/lib/dal";
import { getEditableLanguageCodes } from "@/lib/languages";
import type { Section } from "@/lib/permissions";
import { TranslationError, translateFields, type TranslatedTexts } from "@/lib/translation";
import { fillMissingTranslations } from "@/lib/translation-gaps";
import {
  translatableFieldNames,
  TRANSLATION_SOURCE,
  type TranslatableKind,
} from "@/lib/translation-rules";

const SECTION: Record<TranslatableKind, Section> = {
  product: "products",
  category: "categories",
  content: "content",
};

const kindSchema = z.enum(["product", "category", "content"]);

const formInput = z.object({
  kind: kindSchema,
  fields: z.record(z.string(), z.string().max(20_000)),
  targets: z.array(z.string()).max(20),
});

export type TranslateFormResult = { translations: TranslatedTexts } | { error: string };

/**
 * Formdaki Türkçe alanları çevirip döndürür; hiçbir şey kaydetmez.
 * Çeviriler forma yazılır, kullanıcı kontrol edip kendisi kaydeder.
 */
export async function translateFormFieldsAction(input: unknown): Promise<TranslateFormResult> {
  const parsed = formInput.safeParse(input);
  if (!parsed.success) return { error: "Geçersiz istek; sayfayı yenileyip tekrar deneyin." };
  const { kind, fields, targets } = parsed.data;
  await requireEdit(SECTION[kind]);

  const languageCodes = await getEditableLanguageCodes();
  if (!languageCodes.includes(TRANSLATION_SOURCE)) {
    return { error: "Türkçe dili kapalı; çeviri Türkçeden yapılır." };
  }
  const otherCodes = languageCodes.filter((code) => code !== TRANSLATION_SOURCE);
  const sourceTexts = Object.fromEntries(
    translatableFieldNames(kind)
      .filter((name) => fields[name]?.trim())
      .map((name) => [name, fields[name]])
  );
  const targetCodes = targets.filter((code) => otherCodes.includes(code));

  if (Object.keys(sourceTexts).length === 0) {
    return { error: "Önce Türkçe alanları doldurun." };
  }
  if (targetCodes.length === 0) return { error: "Çevrilecek başka dil yok." };

  try {
    return {
      translations: await translateFields(kind, TRANSLATION_SOURCE, sourceTexts, targetCodes),
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof TranslationError) return { error: error.message };
    console.error("[ceviri] Form çevirisi yapılamadı:", error);
    return { error: UNEXPECTED_ERROR_MESSAGE };
  }
}

const fillInput = z.object({
  kind: kindSchema,
  id: z.string().min(1).max(200),
  // Ürün düzenleme ekranındaki varyant/görsel bölümleri yalnızca kendilerini doldurur.
  scope: z.enum(["all", "media"]).default("all"),
});

export type FillMissingResult =
  | { filled: number; languages: string[] }
  | {
      error: string;
      /** Sınır doldu ya da anahtar geçersiz: sıradaki kayıtlar da yapılamaz. */
      stop: boolean;
    };

/** "Eksik çeviriler" ekranı: tek bir kaydın boş dillerini doldurup kaydeder. */
export async function fillMissingTranslationsAction(input: unknown): Promise<FillMissingResult> {
  const parsed = fillInput.safeParse(input);
  if (!parsed.success) return { error: "Geçersiz istek.", stop: true };
  const { kind, id, scope } = parsed.data;
  await requireEdit(SECTION[kind]);

  try {
    const result = await fillMissingTranslations(kind, id, await getEditableLanguageCodes(), scope);
    if (!result) return { error: "Kayıt bulunamadı; sayfayı yenileyin.", stop: false };

    if (result.filled > 0) {
      const languages = result.languages.map((code) => code.toUpperCase()).join(", ");
      await logActivity("translation.fill", `Eksik çevirileri tamamladı: ${result.label} (${languages})`);
      revalidatePath(kind === "product" ? "/admin/products" : kind === "category" ? "/admin/categories" : "/admin/content");
      if (kind === "product") revalidatePath(`/admin/products/${id}`);
      if (kind === "category") revalidatePath(`/admin/categories/${id}`);
      revalidatePath("/", "layout");
    }
    return { filled: result.filled, languages: result.languages };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof TranslationError) {
      return { error: error.message, stop: error.code !== "failed" };
    }
    console.error("[ceviri] Eksik çeviriler doldurulamadı:", error);
    return { error: UNEXPECTED_ERROR_MESSAGE, stop: false };
  }
}
