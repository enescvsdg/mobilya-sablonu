import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * İşlem kaydında okunur adlar: kimliğin yerine ürünün/kategorinin adı.
 * Önce varsayılan dildeki (Türkçe) ad, yoksa herhangi bir çeviri alınır.
 */

export async function productName(productId: string) {
  const translations = await prisma.productTranslation.findMany({
    where: { productId },
    select: { name: true, languageCode: true },
  });
  return (translations.find((t) => t.languageCode === "tr") ?? translations[0])?.name ?? "adsız ürün";
}

export async function categoryName(categoryId: string) {
  const translations = await prisma.categoryTranslation.findMany({
    where: { categoryId },
    select: { name: true, languageCode: true },
  });
  return (
    (translations.find((t) => t.languageCode === "tr") ?? translations[0])?.name ?? "adsız kategori"
  );
}
