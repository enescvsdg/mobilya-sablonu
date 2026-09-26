import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in-stagger";
import { getContent } from "@/lib/site-content";

export async function Hero() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const content = await getContent("home_hero", locale);

  return (
    <section className="relative flex h-[85vh] min-h-[560px] items-center overflow-hidden">
      {content.imageUrl && (
        <Image
          src={content.imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover animate-kenburns"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/50 to-brand-dark/20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <FadeInStagger waitForIntro>
          <div className="max-w-xl">
            <FadeInItem>
              <h1 className="font-heading text-4xl leading-tight text-surface-warm sm:text-5xl lg:text-6xl">
                {content.title}
              </h1>
            </FadeInItem>
            {content.paragraphs.map((paragraph) => (
              <FadeInItem key={paragraph}>
                <p className="mt-6 font-body text-base text-surface-warm/80 sm:text-lg">
                  {paragraph}
                </p>
              </FadeInItem>
            ))}
            <FadeInItem>
              <Link
                href="/koleksiyonlar"
                className="mt-8 inline-block border border-highlight px-8 py-3 font-body text-sm tracking-widest text-highlight uppercase transition-colors hover:bg-highlight hover:text-brand-dark"
              >
                {t("heroCta")}
              </Link>
            </FadeInItem>
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}
