import { Reveal } from "@/components/motion/reveal";

export type LegalSection = { title: string; text: string };

/**
 * Gizlilik Politikası ve Kullanım Şartları sayfalarının ortak düzeni.
 * İçerik tamamen çeviri dosyalarından gelir.
 */
export function LegalArticle({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Reveal>
        <h1 className="font-heading text-3xl text-brand sm:text-4xl">{title}</h1>
        <p className="mt-3 font-body text-xs tracking-widest text-ink/50 uppercase">
          {lastUpdated}
        </p>
        <p className="mt-8 font-body text-ink/70">{intro}</p>
      </Reveal>

      <div className="mt-12 flex flex-col gap-10">
        {sections.map((section) => (
          <Reveal key={section.title}>
            <section>
              <h2 className="font-heading text-xl text-brand">{section.title}</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
                {section.text}
              </p>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
