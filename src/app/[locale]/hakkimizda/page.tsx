import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in-stagger";
import { buildPageMetadata } from "@/lib/seo";
import { getContent } from "@/lib/site-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    locale,
    path: "/hakkimizda",
    title: t("title"),
    description: tMeta("aboutDescription"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });

  const [intro, workshop, craft] = await Promise.all([
    getContent("about_intro", locale),
    getContent("about_workshop", locale),
    getContent("about_craft", locale),
  ]);

  return (
    <div>
      <FadeInStagger className="mx-auto max-w-3xl px-6 py-20 text-center">
        <FadeInItem>
          <p className="font-body text-xs font-semibold tracking-[0.3em] text-highlight uppercase">
            {t("kicker")}
          </p>
        </FadeInItem>
        <FadeInItem>
          <h1 className="mt-4 font-heading text-4xl text-brand sm:text-5xl">
            {intro.title}
          </h1>
        </FadeInItem>
        {intro.paragraphs.map((paragraph) => (
          <FadeInItem key={paragraph}>
            <p className="mt-8 font-body text-lg text-ink/70">{paragraph}</p>
          </FadeInItem>
        ))}
      </FadeInStagger>

      <section className="grid grid-cols-1 lg:grid-cols-2">
        <Reveal y={0} className="relative aspect-[4/3] overflow-hidden lg:aspect-auto">
          {workshop.imageUrl && (
            <Image
              src={workshop.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </Reveal>
        <div className="flex flex-col justify-center gap-4 bg-surface px-6 py-16 lg:px-16">
          <Reveal>
            {workshop.paragraphs.map((paragraph) => (
              <p key={paragraph} className="font-body text-ink/70 [&+&]:mt-4">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center bg-brand-dark px-6 py-16 lg:order-1 lg:px-16">
          <Reveal>
            <h2 className="font-heading text-2xl text-surface-warm">{craft.title}</h2>
            {craft.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 font-body text-surface-warm/70">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </div>
        <Reveal
          y={0}
          className="relative order-1 aspect-[4/3] overflow-hidden lg:order-2 lg:aspect-auto"
        >
          {craft.imageUrl && (
            <Image
              src={craft.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </Reveal>
      </section>
    </div>
  );
}
