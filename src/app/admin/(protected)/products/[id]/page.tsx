import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEditableLanguages } from "@/lib/languages";
import { isTranslationConfigured } from "@/lib/translation";
import { TRANSLATION_SOURCE } from "@/lib/translation-rules";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { ProductVariants } from "@/components/admin/product-variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

// Otomatik çeviri Google'ın yanıtını bekler; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireView("products");
  const canEdit = allows(admin.permissions, "products", "edit");
  const { id } = await params;

  const [product, categories, languages] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { translations: true },
        },
        variants: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
        category: { select: { isActive: true } },
      },
    }),
    prisma.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    getEditableLanguages(),
  ]);

  if (!product) notFound();
  const translationEnabled = isTranslationConfigured();
  // Varyant adı ve alt metin kutuları Türkçe dışındaki diller için açılır.
  const otherLanguages = languages.filter((language) => language.code !== TRANSLATION_SOURCE);
  // Taslak ürün de sitede önizlenebilir: panel kısa ömürlü bir önizleme
  // bağlantısıyla ürünün Türkçe sayfasını açar.
  const siteTranslation =
    product.translations.find((t) => t.languageCode === TRANSLATION_SOURCE) ??
    product.translations[0];
  const isDraft = !product.isActive || !product.category.isActive;

  const primaryCode = languages[0]?.code ?? "tr";
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name:
      category.translations.find((t) => t.languageCode === primaryCode)?.name ??
      category.translations[0]?.name ??
      category.id,
  }));

  const translations = Object.fromEntries(
    product.translations.map((t) => [
      t.languageCode,
      {
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription ?? "",
        description: t.description ?? "",
        materialsText: t.materialsText ?? "",
        seoTitle: t.seoTitle ?? "",
        seoDescription: t.seoDescription ?? "",
      },
    ])
  );

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" title="Ürünlere dön">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Ürünü Düzenle</h1>
        {siteTranslation && (
          <Button asChild variant="outline" size="sm" className="ms-auto">
            <a
              href={`/admin/onizleme?hedef=${encodeURIComponent(
                `/${siteTranslation.languageCode}/urun/${siteTranslation.slug}`
              )}`}
              target="_blank"
              rel="noopener"
            >
              <Eye />
              {isDraft ? "Taslağı sitede önizle" : "Sitede gör"}
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <ProductForm
            categories={categoryOptions}
            languages={languages}
            translationEnabled={translationEnabled}
            initialValues={{
              id: product.id,
              sku: product.sku,
              categoryId: product.categoryId,
              widthCm: product.widthCm?.toString() ?? "",
              heightCm: product.heightCm?.toString() ?? "",
              depthCm: product.depthCm?.toString() ?? "",
              isActive: product.isActive,
              sortOrder: product.sortOrder,
              translations,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görseller</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImages
            productId={product.id}
            languages={otherLanguages}
            translationEnabled={translationEnabled}
            images={product.images.map((image) => ({
              id: image.id,
              url: image.url,
              altText: image.altText ?? "",
              isPrimary: image.isPrimary,
              translations: Object.fromEntries(
                image.translations.map((t) => [t.languageCode, t.altText])
              ),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Varyantlar</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductVariants
            productId={product.id}
            languages={otherLanguages}
            translationEnabled={translationEnabled}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              colorHex: variant.colorHex ?? "",
              translations: Object.fromEntries(
                variant.translations.map((t) => [t.languageCode, t.name])
              ),
            }))}
          />
        </CardContent>
      </Card>
    </div>
    </ReadOnlySection>
  );
}
