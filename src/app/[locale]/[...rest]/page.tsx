import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

/**
 * `[locale]` altında hiçbir sayfayla eşleşmeyen yollar için yakalayıcı.
 *
 * Next.js, hiçbir route ile eşleşmeyen bir istekte, açıkça `notFound()`
 * çağrılmadığı sürece nested `not-found.tsx` dosyalarını DEVREYE ALMAZ —
 * kök `app/not-found.tsx` yoksa (bu projede Multiple Root Layouts deseni
 * nedeniyle yok) dahili, dile duyarsız varsayılan 404 sayfasını gösterir.
 * Bu dosya, geçerli bir dil önekiyle gelen ama karşılığı olmayan her yolu
 * `[locale]` segmentine "eşleştirerek" `src/app/[locale]/not-found.tsx`
 * içindeki markalı/çok dilli 404'ün tetiklenmesini sağlar.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (hasLocale(routing.locales, locale)) {
    setRequestLocale(locale);
  }

  notFound();
}
