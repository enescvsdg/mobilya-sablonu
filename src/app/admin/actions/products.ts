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
import { productName } from "@/lib/activity-labels";
import { TRANSLATION_SOURCE } from "@/lib/translation-rules";

export type ProductFormState = { error?: string } | undefined;

function optionalDecimal(formData: FormData, key: string): string | undefined {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? undefined : raw;
}

function optionalText(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? null : raw;
}

function revalidateProducts(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  // Ürün kartları ana sayfa, koleksiyon ve ürün sayfalarında görünür.
  revalidatePath("/", "layout");
}

/** Görselleri 0..n-1 olarak yeniden sıralar ve tek bir ana görsel bırakır. */
async function normalizeImageOrder(productId: string) {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const hasPrimary = images.some((image) => image.isPrimary);

  await prisma.$transaction(
    images.map((image, index) =>
      prisma.productImage.update({
        where: { id: image.id },
        data: {
          sortOrder: index,
          // Ana görsel silinmişse ilk görsel ana görsel olur.
          isPrimary: hasPrimary ? image.isPrimary : index === 0,
        },
      })
    )
  );
}

export async function saveProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireEdit("products");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const sku = String(formData.get("sku") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  const languageCodes = await getEditableLanguageCodes();
  const defaultCode = languageCodes[0];
  const fallbackName = String(formData.get(`name_${defaultCode}`) ?? "").trim();

  if (!sku || !categoryId || !fallbackName) {
    return {
      error: `SKU, kategori ve ${defaultCode.toUpperCase()} isim zorunlu.`,
    };
  }

  const translations = languageCodes.map((code) => {
    const name = String(formData.get(`name_${code}`) ?? "").trim() || fallbackName;
    const rawSlug = String(formData.get(`slug_${code}`) ?? "").trim();
    return {
      languageCode: code,
      name,
      // Arapça ya da Kiril harfli bir isimden Latin adres çıkmaz; o zaman
      // ana dildeki isimden üretilir.
      slug: slugify(rawSlug || name) || slugify(fallbackName),
      shortDescription: optionalText(formData, `shortDescription_${code}`),
      description: optionalText(formData, `description_${code}`),
      materialsText: optionalText(formData, `materialsText_${code}`),
      seoTitle: optionalText(formData, `seoTitle_${code}`),
      seoDescription: optionalText(formData, `seoDescription_${code}`),
    };
  });

  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = sortOrderRaw === "" ? 0 : Number(sortOrderRaw);
  if (Number.isNaN(sortOrder)) {
    return { error: "Sıra numarası sayı olmalı." };
  }

  const data = {
    sku,
    categoryId,
    widthCm: optionalDecimal(formData, "widthCm"),
    heightCm: optionalDecimal(formData, "heightCm"),
    depthCm: optionalDecimal(formData, "depthCm"),
    isActive: formData.get("isActive") === "on",
    sortOrder,
  };

  let productId: string;
  try {
    if (id) {
      await prisma.product.update({ where: { id }, data });
      for (const translation of translations) {
        await prisma.productTranslation.upsert({
          where: {
            productId_languageCode: {
              productId: id,
              languageCode: translation.languageCode,
            },
          },
          update: translation,
          create: { ...translation, productId: id },
        });
      }
      productId = id;
    } else {
      const created = await prisma.product.create({
        data: { ...data, translations: { create: translations } },
      });
      productId = created.id;
    }
  } catch {
    return {
      error: "Kaydedilemedi — SKU veya isim başka bir üründe kullanılıyor olabilir.",
    };
  }

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (images.length > 0) {
    const existingImageCount = await prisma.productImage.count({ where: { productId } });
    try {
      for (const [index, file] of images.entries()) {
        const url = await saveUploadedImage(file, "products");
        await prisma.productImage.create({
          data: {
            productId,
            url,
            sortOrder: existingImageCount + index,
            isPrimary: existingImageCount === 0 && index === 0,
          },
        });
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Görsel yüklenemedi." };
    }
  }

  await logActivity(
    id ? "product.update" : "product.create",
    `${id ? "Ürünü güncelledi" : "Ürün ekledi"}: ${fallbackName}`
  );
  revalidateProducts(productId);

  // Yeni ürün kaydedildikten sonra görsel ve varyant yönetimi için
  // düzenleme ekranına geçilir.
  redirect(id ? "/admin/products" : `/admin/products/${productId}`);
}

export async function deleteProductAction(id: string) {
  await requireEdit("products");
  const name = await productName(id);
  await prisma.product.delete({ where: { id } });
  await logActivity("product.delete", `Ürünü sildi: ${name}`);
  revalidateProducts();
}

export async function toggleProductFeaturedAction(id: string): Promise<ActionResult> {
  await requireEdit("products");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { isFeatured: true },
  });
  if (!product) return { error: "Ürün bulunamadı — sayfayı yenileyin." };

  await prisma.product.update({
    where: { id },
    data: { isFeatured: !product.isFeatured },
  });
  await logActivity(
    "product.feature",
    `${product.isFeatured ? "Öne çıkarmayı kaldırdı" : "Öne çıkardı"}: ${await productName(id)}`
  );

  revalidateProducts(id);
}

export async function uploadProductImagesAction(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireEdit("products");

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return { error: "Yüklenecek görsel seçilmedi." };
  }

  const existingCount = await prisma.productImage.count({ where: { productId } });
  try {
    for (const [index, file] of files.entries()) {
      const url = await saveUploadedImage(file, "products");
      await prisma.productImage.create({
        data: {
          productId,
          url,
          sortOrder: existingCount + index,
          isPrimary: existingCount === 0 && index === 0,
        },
      });
    }
  } catch (error) {
    // Birkaç görselden biri başarısız olsa bile yüklenenler listede görünsün.
    revalidateProducts(productId);
    return { error: error instanceof Error ? error.message : "Görsel yüklenemedi." };
  }

  await logActivity(
    "product.images.upload",
    `${await productName(productId)} ürününe ${files.length} görsel yükledi`
  );
  revalidateProducts(productId);
}

/**
 * Görselin alt metni. Türkçesi görselin kendi sütununda, diğer diller
 * ProductImageTranslation'da durur; boş bırakılan dilin kaydı silinir.
 */
export async function updateProductImageAltAction(
  imageId: string,
  altText: string,
  languageCode: string = TRANSLATION_SOURCE
) {
  await requireEdit("products");

  const trimmed = String(altText).trim();
  let productId: string;
  if (languageCode === TRANSLATION_SOURCE) {
    ({ productId } = await prisma.productImage.update({
      where: { id: imageId },
      data: { altText: trimmed === "" ? null : trimmed },
    }));
  } else {
    const codes = await getEditableLanguageCodes();
    if (!codes.includes(languageCode)) throw new Error("Geçersiz dil.");
    ({ productId } = await prisma.productImage.findUniqueOrThrow({
      where: { id: imageId },
      select: { productId: true },
    }));
    if (trimmed) {
      await prisma.productImageTranslation.upsert({
        where: { imageId_languageCode: { imageId, languageCode } },
        update: { altText: trimmed },
        create: { imageId, languageCode, altText: trimmed },
      });
    } else {
      await prisma.productImageTranslation.deleteMany({ where: { imageId, languageCode } });
    }
  }

  revalidateProducts(productId);
}

export async function setPrimaryProductImageAction(imageId: string): Promise<ActionResult> {
  await requireEdit("products");

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: "Görsel bulunamadı — sayfayı yenileyin." };

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
  await logActivity(
    "product.images.primary",
    `${await productName(image.productId)} ürününün ana görselini değiştirdi`
  );

  revalidateProducts(image.productId);
}

export async function moveProductImageAction(
  imageId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  await requireEdit("products");

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: "Görsel bulunamadı — sayfayı yenileyin." };

  const images = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = images.findIndex((item) => item.id === imageId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= images.length) return;

  const reordered = [...images];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  await prisma.$transaction(
    reordered.map((item, order) =>
      prisma.productImage.update({ where: { id: item.id }, data: { sortOrder: order } })
    )
  );

  revalidateProducts(image.productId);
}

export async function deleteProductImageAction(imageId: string) {
  await requireEdit("products");

  const image = await prisma.productImage.delete({ where: { id: imageId } });
  await normalizeImageOrder(image.productId);
  await logActivity(
    "product.images.delete",
    `${await productName(image.productId)} ürününden bir görsel sildi`
  );

  revalidateProducts(image.productId);
}
