import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in-stagger";
import { ProductGallery } from "@/components/site/product-gallery";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { TRANSLATION_SOURCE } from "@/lib/translation-rules";
import { PREVIEW_COOKIE, verifyPreviewToken } from "@/lib/preview";

/** Yayından kaldırılan bir kategorinin ürünleri de sitede görünmez. */
function isOnSite(product: { isActive: boolean; category: { isActive: boolean } }) {
  return product.isActive && product.category.isActive;
}

/**
 * Panelden "Sitede önizle" ile gelen kullanıcı (imzalı önizleme çerezi)
 * yayında olmayan (taslak) ürünü de görür; ziyaretçi için sayfa yoktur.
 */
async function isPreviewing() {
  const store = await cookies();
  return verifyPreviewToken("cookie", store.get(PREVIEW_COOKIE)?.value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const productTranslation = await prisma.productTranslation.findUnique({
    where: { languageCode_slug: { languageCode: locale, slug } },
    include: {
      product: {
        select: {
          isActive: true,
          category: { select: { isActive: true } },
          translations: { select: { languageCode: true, slug: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            include: { translations: { where: { languageCode: locale } } },
          },
        },
      },
    },
  });

  if (!productTranslation) return {};
  if (!isOnSite(productTranslation.product)) {
    // Taslak yalnızca önizlemede açılır ve hiçbir zaman dizine girmez;
    // ziyaretçiye sayfa 404 verecek, boş metadata yeterli.
    return (await isPreviewing())
      ? { title: productTranslation.name, robots: { index: false, follow: false } }
      : {};
  }

  const image = productTranslation.product.images[0];
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    locale,
    path: `/urun/${slug}`,
    title: productTranslation.seoTitle ?? productTranslation.name,
    description:
      productTranslation.seoDescription ??
      productTranslation.shortDescription ??
      productTranslation.description ??
      tMeta("productDescription", { name: productTranslation.name }),
    // Her dilin kendi slug'ı farklı olduğundan hreflang'ler çeviriden kurulur.
    pathByLocale: Object.fromEntries(
      productTranslation.product.translations.map((t) => [t.languageCode, `/urun/${t.slug}`])
    ),
    images: image
      ? [
          {
            url: image.url,
            alt:
              (locale === TRANSLATION_SOURCE ? image.altText : image.translations[0]?.altText) ??
              productTranslation.name,
          },
        ]
      : undefined,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Product");
  const tNav = await getTranslations("Nav");

  const productTranslation = await prisma.productTranslation.findUnique({
    where: { languageCode_slug: { languageCode: locale, slug } },
    include: {
      product: {
        include: {
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: { translations: { where: { languageCode: locale } } },
          },
          variants: {
            orderBy: { sortOrder: "asc" },
            include: { translations: { where: { languageCode: locale } } },
          },
          category: {
            include: { translations: { where: { languageCode: locale } } },
          },
        },
      },
    },
  });

  if (!productTranslation) notFound();
  const isDraft = !isOnSite(productTranslation.product);
  if (isDraft && !(await isPreviewing())) notFound();

  const { product } = productTranslation;
  const categoryTranslation = product.category.translations[0];
  // Birim dile göre yazılır (Arapça: سم); sağdan sola dillerde ölçüler de
  // sağdan başlar.
  const unit = t("unitCm");
  const dimensions = [product.widthCm, product.heightCm, product.depthCm]
    .filter(Boolean)
    .map((value) => `${value} ${unit}`);

  const quoteHref = `/iletisim?urun=${encodeURIComponent(slug)}&isim=${encodeURIComponent(
    productTranslation.name
  )}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: productTranslation.name,
          sku: product.sku,
          url: absoluteUrl(`/${locale}/urun/${slug}`),
          brand: { "@type": "Brand", name: SITE_NAME },
          ...(productTranslation.description || productTranslation.shortDescription
            ? {
                description:
                  productTranslation.description ?? productTranslation.shortDescription,
              }
            : {}),
          ...(productTranslation.materialsText
            ? { material: productTranslation.materialsText }
            : {}),
          ...(categoryTranslation ? { category: categoryTranslation.name } : {}),
          ...(product.images.length > 0
            ? { image: product.images.map((img) => absoluteUrl(img.url)) }
            : {}),
          // Fiyat sitede gösterilmediği için "offers" verilmez: fiyatsız bir
          // teklif Search Console'da "price eksik" hatası olarak görünür.
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tNav("home"), path: `/${locale}` },
          { name: tNav("collections"), path: `/${locale}/koleksiyonlar` },
          ...(categoryTranslation
            ? [
                {
                  name: categoryTranslation.name,
                  path: `/${locale}/koleksiyonlar/${categoryTranslation.slug}`,
                },
              ]
            : []),
          { name: productTranslation.name, path: `/${locale}/urun/${slug}` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-6 py-16">
      {isDraft && (
        // Yalnızca panel kullanıcısı görür; panel dili Türkçe.
        <p
          role="status"
          lang="tr"
          dir="ltr"
          className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 font-body text-sm text-amber-900"
        >
          Taslak — bu ürün yayında değil. Yalnızca panel önizlemesinde görünür,
          ziyaretçiler göremez.
        </p>
      )}
      {categoryTranslation && (
        <Link
          href={`/koleksiyonlar/${categoryTranslation.slug}`}
          className="font-body text-sm text-brand/70 hover:text-brand"
        >
          {/* Sağdan sola dillerde ok ters döner. */}
          <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
            ←
          </span>{" "}
          {t("backToCollection")}
        </Link>
      )}

      <FadeInStagger className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <FadeInItem>
          <ProductGallery
            images={product.images.map((image) => ({
              id: image.id,
              url: image.url,
              // Türkçesi görselin kendi sütununda; diğer dillerde boşsa
              // galeri o dilin ürün adını kullanır.
              altText:
                locale === TRANSLATION_SOURCE ? image.altText : (image.translations[0]?.altText ?? null),
            }))}
            productName={productTranslation.name}
          />
        </FadeInItem>

        <FadeInItem className="flex flex-col">
          <h1 className="font-heading text-3xl text-brand sm:text-4xl">
            {productTranslation.name}
          </h1>
          {(productTranslation.description || productTranslation.shortDescription) && (
            <p className="mt-6 font-body text-ink/70">
              {productTranslation.description || productTranslation.shortDescription}
            </p>
          )}

          {dimensions.length > 0 && (
            <div className="mt-8 border-t border-hairline pt-6">
              <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
                {t("dimensions")}
              </h2>
              <p className="mt-2 font-body text-ink/80">
                {dimensions.join(" × ")}
              </p>
            </div>
          )}

          {productTranslation.materialsText && (
            <div className="mt-8 border-t border-hairline pt-6">
              <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
                {t("materials")}
              </h2>
              <p className="mt-2 font-body text-ink/80">
                {productTranslation.materialsText}
              </p>
            </div>
          )}

          {product.variants.length > 0 && (
            <div className="mt-8 border-t border-hairline pt-6">
              <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
                {t("variants")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-4">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="flex items-center gap-2">
                    {variant.colorHex && (
                      <span
                        aria-hidden
                        className="size-5 rounded-full border border-hairline"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                    )}
                    <span className="font-body text-sm text-ink/80">
                      {/* Çevirisi yoksa Türkçe adı görünür. */}
                      {variant.translations[0]?.name || variant.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-hairline pt-6">
            <Link
              href={quoteHref}
              className="block w-fit border border-brand px-8 py-3 text-center font-body text-sm tracking-widest text-brand uppercase transition-colors hover:bg-brand hover:text-surface-warm"
            >
              {t("requestQuote")}
            </Link>
          </div>
        </FadeInItem>
        </FadeInStagger>
      </div>
    </>
  );
}
