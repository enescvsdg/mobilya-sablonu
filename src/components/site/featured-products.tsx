import { getLocale, getTranslations } from "next-intl/server";

import { FEATURED_LIMIT, PRODUCT_ORDER } from "@/lib/featured";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";

export async function FeaturedProducts() {
  const locale = await getLocale();
  const t = await getTranslations("Home");

  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true, category: { isActive: true } },
    include: {
      translations: { where: { languageCode: locale } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: PRODUCT_ORDER,
    take: FEATURED_LIMIT,
  });

  if (products.length === 0) return null;

  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <h2 className="font-heading text-3xl text-brand">{t("productsTitle")}</h2>
        </Reveal>
        <StaggerContainer className="mt-10 flex flex-wrap justify-center gap-8">
          {products.map((product) => {
            const translation = product.translations[0];
            if (!translation) return null;
            return (
              <StaggerItem
                key={product.id}
                className="w-full max-w-sm sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
              >
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
      </div>
    </section>
  );
}
