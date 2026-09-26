import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Collections" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return buildPageMetadata({
    locale,
    path: "/koleksiyonlar",
    title: t("title"),
    description: tMeta("collectionsDescription"),
  });
}

export default async function CollectionsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Collections");

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      translations: { where: { languageCode: locale } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <Reveal>
        <h1 className="font-heading text-4xl text-brand">{t("title")}</h1>
        <p className="mt-3 font-body text-ink/70">{t("subtitle")}</p>
      </Reveal>

      {categories.length === 0 ? (
        <p className="mt-16 font-body text-ink/50">{t("noCategories")}</p>
      ) : (
        <StaggerContainer className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const translation = category.translations[0];
            if (!translation) return null;
            return (
              <StaggerItem key={category.id}>
                <Link
                  href={`/koleksiyonlar/${translation.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-sm"
                >
                  {category.coverImage ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${category.coverImage})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-dark transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
                  <div className="absolute bottom-6 start-6">
                    <span className="font-heading text-xl text-surface-warm">
                      {translation.name}
                    </span>
                    <span className="mt-1 block font-body text-xs tracking-widest text-surface-warm/60 uppercase">
                      {category._count.products}
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
