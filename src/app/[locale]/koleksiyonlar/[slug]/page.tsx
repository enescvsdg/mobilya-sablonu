import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const categoryTranslation = await prisma.categoryTranslation.findUnique({
    where: { languageCode_slug: { languageCode: locale, slug } },
    include: {
      category: {
        select: { isActive: true, coverImage: true, translations: true },
      },
    },
  });

  if (!categoryTranslation || !categoryTranslation.category.isActive) {
    // Sayfa 404 verecek; boş metadata yeterli.
    return {};
  }

  const coverImage = categoryTranslation.category.coverImage;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    locale,
    path: `/koleksiyonlar/${slug}`,
    title: categoryTranslation.seoTitle ?? categoryTranslation.name,
    // Açıklama panelde boş bırakılırsa Google sayfadan rastgele bir metin
    // seçmesin diye genel bir cümle kullanılır.
    description:
      categoryTranslation.seoDescription ??
      categoryTranslation.description ??
      tMeta("collectionDescription", { name: categoryTranslation.name }),
    // Her dilin kendi slug'ı farklı olduğundan hreflang'ler çeviriden kurulur.
    pathByLocale: Object.fromEntries(
      categoryTranslation.category.translations.map((t) => [
        t.languageCode,
        `/koleksiyonlar/${t.slug}`,
      ])
    ),
    images: coverImage ? [{ url: coverImage, alt: categoryTranslation.name }] : undefined,
  });
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Collections");
  const tNav = await getTranslations("Nav");

  const categoryTranslation = await prisma.categoryTranslation.findUnique({
    where: { languageCode_slug: { languageCode: locale, slug } },
    include: {
      category: {
        include: {
          products: {
            where: { isActive: true },
            include: {
              translations: { where: { languageCode: locale } },
              images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!categoryTranslation || !categoryTranslation.category.isActive) {
    notFound();
  }

  const { category } = categoryTranslation;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tNav("home"), path: `/${locale}` },
          { name: tNav("collections"), path: `/${locale}/koleksiyonlar` },
          { name: categoryTranslation.name, path: `/${locale}/koleksiyonlar/${slug}` },
        ])}
      />
      <Reveal>
        <h1 className="font-heading text-4xl text-brand">{categoryTranslation.name}</h1>
        {categoryTranslation.description && (
          <p className="mt-3 max-w-2xl font-body text-ink/70">
            {categoryTranslation.description}
          </p>
        )}
      </Reveal>

      {category.products.length === 0 ? (
        <p className="mt-16 font-body text-ink/50">{t("empty")}</p>
      ) : (
        <StaggerContainer className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {category.products.map((product) => {
            const translation = product.translations[0];
            if (!translation) return null;
            return (
              <StaggerItem key={product.id}>
                <ProductCard
                  slug={translation.slug}
                  name={translation.name}
                  shortDescription={translation.shortDescription}
                  imageUrl={product.images[0]?.url}
                />
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
