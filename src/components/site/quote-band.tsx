import Image from "next/image";
import { getLocale } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { getContent } from "@/lib/site-content";

export async function QuoteBand() {
  const locale = await getLocale();
  const content = await getContent("home_quote", locale);
  const quote = content.paragraphs.join(" ");

  if (!quote) return null;

  return (
    <section className="relative flex h-[50vh] min-h-[380px] items-center justify-center overflow-hidden">
      {content.imageUrl && (
        <Image
          src={content.imageUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-brand-dark/70" />
      <Reveal>
        <p className="relative max-w-2xl px-6 text-center font-heading text-2xl text-surface-warm italic sm:text-3xl">
          &ldquo;{quote}&rdquo;
        </p>
      </Reveal>
    </section>
  );
}
