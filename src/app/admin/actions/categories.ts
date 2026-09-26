"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import { requireEdit } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { getEditableLanguageCodes } from "@/lib/languages";
import { slugify } from "@/lib/slugify";
import { saveUploadedImage } from "@/lib/upload";
import { categoryName } from "@/lib/activity-labels";

export type CategoryFormState = { error?: string; success?: boolean } | undefined;

function optionalText(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? null : raw;
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  // Koleksiyon menüsü ve listeleri tüm dillerde etkilenir.
  revalidatePath("/", "layout");
}

export async function saveCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireEdit("categories");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const languageCodes = await getEditableLanguageCodes();
  const defaultCode = languageCodes[0];

  const fallbackName = String(formData.get(`name_${defaultCode}`) ?? "").trim();
  if (!fallbackName) {
    return { error: `${defaultCode.toUpperCase()} isim zorunlu.` };
  }

  const translations = languageCodes.map((code) => {
    const name = String(formData.get(`name_${code}`) ?? "").trim() || fallbackName;
    // Slug elle girilmediyse isimden üretilir; girildiyse yine de temizlenir.
    const rawSlug = String(formData.get(`slug_${code}`) ?? "").trim();
    return {
      languageCode: code,
      name,
      // Arapça ya da Kiril harfli bir isimden Latin adres çıkmaz; o zaman
      // ana dildeki isimden üretilir.
      slug: slugify(rawSlug || name) || slugify(fallbackName),
      description: optionalText(formData, `description_${code}`),
      seoTitle: optionalText(formData, `seoTitle_${code}`),
      seoDescription: optionalText(formData, `seoDescription_${code}`),
    };
  });

  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const data = {
    isActive: formData.get("isActive") === "on",
    sortOrder: sortOrderRaw === "" ? 0 : Number(sortOrderRaw),
  };

  if (Number.isNaN(data.sortOrder)) {
    return { error: "Sıra numarası sayı olmalı." };
  }

  let categoryId: string;
  try {
    if (id) {
      await prisma.category.update({ where: { id }, data });
      for (const translation of translations) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_languageCode: {
              categoryId: id,
              languageCode: translation.languageCode,
            },
          },
          update: translation,
          create: { ...translation, categoryId: id },
        });
      }
      categoryId = id;
    } else {
      const created = await prisma.category.create({
        data: { ...data, translations: { create: translations } },
      });
      categoryId = created.id;
    }
  } catch {
    return {
      error:
        "Kaydedilemedi — bu isim (ya da ondan üretilen adres) başka bir kategoride kullanılıyor olabilir.",
    };
  }

  const coverImage = formData.get("coverImage");
  if (coverImage instanceof File && coverImage.size > 0) {
    try {
      const url = await saveUploadedImage(coverImage, "categories");
      await prisma.category.update({ where: { id: categoryId }, data: { coverImage: url } });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Kapak görseli yüklenemedi.",
      };
    }
  }

  await logActivity(
    id ? "category.update" : "category.create",
    `${id ? "Kategoriyi güncelledi" : "Kategori ekledi"}: ${fallbackName}`
  );
  revalidateCategories();

  if (!id) {
    redirect(`/admin/categories/${categoryId}`);
  }

  // Düzenlemede sayfa yönlenmez; istemcinin başarıyı fark edip toast
  // gösterebilmesi için açıkça bir durum döndürülür (aksi halde
  // useActionState'in state'i undefined -> undefined kalır ve değişmez).
  return { success: true };
}

export async function deleteCategoryCoverAction(id: string) {
  await requireEdit("categories");
  await prisma.category.update({ where: { id }, data: { coverImage: null } });
  await logActivity("category.cover.delete", `Kapak görselini kaldırdı: ${await categoryName(id)}`);
  revalidateCategories();
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireEdit("categories");

  const name = await categoryName(id);
  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    return {
      error: "Bu kategori silinemiyor — içinde ürün olan kategoriler silinemez.",
    };
  }

  await logActivity("category.delete", `Kategoriyi sildi: ${name}`);
  revalidateCategories();
}
