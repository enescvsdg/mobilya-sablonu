import { getLocale, getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";

export async function FeaturedCollections() {
  const locale = await getLocale();
  const t = await getTranslations("Home");

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { translations: { where: { languageCode: locale } } },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <h2 className="font-heading text-3xl text-brand">{t("collectionsTitle")}</h2>
      </Reveal>
      <StaggerContainer className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                <span className="absolute bottom-6 start-6 font-heading text-xl text-surface-warm">
                  {translation.name}
                </span>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
