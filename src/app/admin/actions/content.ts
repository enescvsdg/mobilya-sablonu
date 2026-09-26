"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireEdit } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { getEditableLanguageCodes } from "@/lib/languages";
import { getContentBlock } from "@/lib/site-content";
import { saveUploadedImage } from "@/lib/upload";

export type ContentFormState = { error?: string; savedKey?: string } | undefined;

function revalidateSite() {
  // Metinler ana sayfa ve Hakkımızda'da kullanılıyor; tüm site yenilenir.
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
}

export async function saveSiteContentAction(
  _prevState: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  await requireEdit("content");

  const key = String(formData.get("key") ?? "").trim();
  const block = getContentBlock(key);
  if (!block) {
    return { error: "Tanımsız içerik bloğu." };
  }

  const languageCodes = await getEditableLanguageCodes();

  // Görsel blok başına tektir; tüm dillerin satırına aynı adres yazılır.
  let uploadedImageUrl: string | undefined;
  const imageFile = formData.get("image");
  if (block.fields.includes("image") && imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImageUrl = await saveUploadedImage(imageFile, "content");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Görsel yüklenemedi." };
    }
  }

  const content = await prisma.siteContent.upsert({
    where: { key },
    update: {},
    create: { key },
  });

  for (const languageCode of languageCodes) {
    const title = block.fields.includes("title")
      ? String(formData.get(`title_${languageCode}`) ?? "").trim() || null
      : null;
    const body = block.fields.includes("body")
      ? String(formData.get(`body_${languageCode}`) ?? "").trim() || null
      : null;

    await prisma.siteContentTranslation.upsert({
      where: {
        siteContentId_languageCode: { siteContentId: content.id, languageCode },
      },
      update: {
        title,
        body,
        // Yeni görsel yüklenmediyse mevcut adres korunur.
        ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
      },
      create: {
        siteContentId: content.id,
        languageCode,
        title,
        body,
        imageUrl: uploadedImageUrl ?? null,
      },
    });
  }

  await logActivity("content.update", `Site metnini güncelledi: ${block.label}`);
  revalidateSite();
  return { savedKey: key };
}

/** Bloğu sıfırlar: kayıtlar silinir, site hazır metinlere geri döner. */
export async function resetSiteContentAction(key: string) {
  await requireEdit("content");

  const content = await prisma.siteContent.findUnique({ where: { key } });
  if (content) {
    await prisma.siteContent.delete({ where: { id: content.id } });
    await logActivity(
      "content.reset",
      `Site metnini hazır metne döndürdü: ${getContentBlock(key)?.label ?? key}`
    );
  }

  revalidateSite();
}
