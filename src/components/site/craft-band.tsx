import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";
import { getContent } from "@/lib/site-content";

export async function CraftBand() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const content = await getContent("home_craft", locale);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2">
      <Reveal y={0} className="relative aspect-[4/3] overflow-hidden lg:aspect-auto">
        {content.imageUrl && (
          <Image
            src={content.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </Reveal>
      <div className="flex flex-col justify-center bg-surface px-6 py-16 lg:px-16">
        <Reveal>
          <h2 className="font-heading text-3xl text-brand">{content.title}</h2>
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-6 max-w-md font-body text-ink/70">
              {paragraph}
            </p>
          ))}
          <Link
            href="/hakkimizda"
            className="mt-8 inline-block w-fit border-b border-brand font-body text-sm tracking-widest text-brand uppercase transition-opacity hover:opacity-70"
          >
            {t("craftCta")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
