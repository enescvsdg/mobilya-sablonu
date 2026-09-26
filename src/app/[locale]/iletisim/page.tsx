import type { Metadata } from "next";
import { MapPin, Navigation } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { ContactForm } from "@/components/site/contact-form";
import { InstagramIcon } from "@/components/site/instagram-icon";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in-stagger";
import { Reveal } from "@/components/motion/reveal";
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
  siteConfig,
} from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/seo";
import { getWhatsappNumber } from "@/lib/site-settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return buildPageMetadata({
    locale,
    path: "/iletisim",
    title: t("title"),
    description: tMeta("contactDescription"),
  });
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ urun?: string; isim?: string }>;
}) {
  const { urun, isim } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("Contact");
  const whatsappNumber = await getWhatsappNumber();

  let productId: string | undefined;
  if (urun) {
    const productTranslation = await prisma.productTranslation.findUnique({
      where: { languageCode_slug: { languageCode: locale, slug: urun } },
      select: { productId: true },
    });
    productId = productTranslation?.productId;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <FadeInStagger>
        <FadeInItem>
          <h1 className="font-heading text-4xl text-brand">{t("title")}</h1>
          <p className="mt-3 max-w-xl font-body text-ink/70">{t("subtitle")}</p>
        </FadeInItem>
      </FadeInStagger>

      <FadeInStagger className="mt-12 grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
        <FadeInItem>
          <ContactForm productId={productId} productName={isim} />
        </FadeInItem>

        <FadeInItem className="flex flex-col gap-8">
          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
              {t("infoTitle")}
            </h2>
            <p className="mt-3 font-body text-sm text-ink/80">
              {siteConfig.email}
            </p>
            {whatsappNumber && (
              // Mesaj ziyaretçinin dilinde hazır yazılı açılır.
              <a
                href={whatsappLink(whatsappNumber, t("whatsappMessage"))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 font-body text-sm text-ink/80 transition-colors hover:text-brand"
              >
                <WhatsappIcon className="size-4" />
                <span dir="ltr">{t("whatsapp")}</span>
              </a>
            )}
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
              {t("followUs")}
            </h2>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-body text-sm text-ink/80 transition-colors hover:text-brand"
            >
              <InstagramIcon className="size-4" />
            <span dir="ltr">@{siteConfig.instagramHandle}</span>
            </a>
          </div>

          <div>
            <h2 className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
              {t("addressTitle")}
            </h2>
            <p className="mt-3 flex items-start gap-2 font-body text-sm text-ink/80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              {/* Latin adres, sağdan sola dillerde de karışmadan okunur. */}
              <bdi>{siteConfig.address.line}</bdi>
            </p>
            <a
              href={getGoogleMapsDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-body text-sm text-brand transition-opacity hover:opacity-70"
            >
              <Navigation className="size-4" />
              {t("getDirections")}
            </a>
          </div>
        </FadeInItem>
      </FadeInStagger>

      <Reveal className="mt-16 aspect-video w-full overflow-hidden rounded-sm border border-hairline">
        <iframe
          src={getGoogleMapsEmbedUrl()}
          title={t("addressTitle")}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Reveal>
    </div>
  );
}
