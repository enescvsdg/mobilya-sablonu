"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";
import { productName } from "@/lib/activity-labels";
import { requireEdit } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { getEditableLanguageCodes } from "@/lib/languages";
import { TRANSLATION_SOURCE } from "@/lib/translation-rules";

export type VariantFormState = { error?: string; success?: boolean } | undefined;

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function revalidateProduct(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/", "layout");
}

/**
 * Varyant adının Türkçe dışındaki dilleri (name_en, name_ru…). Formda
 * alanı olan diller yazılır; boş bırakılanın çevirisi silinir.
 */
async function saveVariantTranslations(variantId: string, formData: FormData) {
  const codes = (await getEditableLanguageCodes()).filter((code) => code !== TRANSLATION_SOURCE);
  for (const languageCode of codes) {
    const raw = formData.get(`name_${languageCode}`);
    if (raw === null) continue;
    const name = String(raw).trim();
    if (name) {
      await prisma.productVariantTranslation.upsert({
        where: { variantId_languageCode: { variantId, languageCode } },
        update: { name },
        create: { variantId, languageCode, name },
      });
    } else {
      await prisma.productVariantTranslation.deleteMany({ where: { variantId, languageCode } });
    }
  }
}

export async function saveProductVariantAction(
  _prevState: VariantFormState,
  formData: FormData
): Promise<VariantFormState> {
  await requireEdit("products");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const colorHexRaw = String(formData.get("colorHex") ?? "").trim();

  if (!productId || !name) {
    return { error: "Varyant adı zorunlu." };
  }
  if (colorHexRaw && !HEX_PATTERN.test(colorHexRaw)) {
    return { error: "Renk kodu #a1b2c3 biçiminde olmalı." };
  }

  const data = {
    name,
    colorHex: colorHexRaw || null,
  };

  try {
    if (id) {
      await prisma.productVariant.update({ where: { id }, data });
      await saveVariantTranslations(id, formData);
    } else {
      const last = await prisma.productVariant.findFirst({
        where: { productId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      await prisma.productVariant.create({
        data: { ...data, productId, sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
    }
  } catch {
    return { error: "Varyant kaydedilemedi." };
  }
  await logActivity(
    id ? "variant.update" : "variant.create",
    `${await productName(productId)} ürününde varyant ${id ? "güncelledi" : "ekledi"}: ${name}`
  );

  revalidateProduct(productId);

  // Bu ekranda kayıttan sonra yönlendirme yok; istemcinin başarıyı fark
  // edip toast gösterebilmesi için açıkça bir durum döndürülür.
  return { success: true };
}

export async function deleteProductVariantAction(id: string) {
  await requireEdit("products");
  const variant = await prisma.productVariant.delete({ where: { id } });
  await logActivity(
    "variant.delete",
    `${await productName(variant.productId)} ürününden varyant sildi: ${variant.name}`
  );
  revalidateProduct(variant.productId);
}

export async function moveProductVariantAction(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  await requireEdit("products");

  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) return { error: "Varyant bulunamadı — sayfayı yenileyin." };

  const variants = await prisma.productVariant.findMany({
    where: { productId: variant.productId },
    orderBy: { sortOrder: "asc" },
  });

  const index = variants.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= variants.length) return;

  const reordered = [...variants];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  await prisma.$transaction(
    reordered.map((item, order) =>
      prisma.productVariant.update({ where: { id: item.id }, data: { sortOrder: order } })
    )
  );

  revalidateProduct(variant.productId);
}
