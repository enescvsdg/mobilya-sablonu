import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * Tek satırlık ayar kaydı (site_settings). Satırı migration ekler; yine
 * de yoksa varsayılanlarla oluşturulur.
 */
export async function getSiteSettings() {
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export async function setComingSoon(enabled: boolean) {
  return prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { comingSoon: enabled },
    create: { id: 1, comingSoon: enabled },
  });
}

/**
 * WhatsApp numarası (yalnızca rakam) ya da null. Okunamazsa (ör. henüz
 * migration uygulanmamış bir önizleme) bağlantı gösterilmez, sayfa yine
 * açılır.
 */
export const getWhatsappNumber = cache(async (): Promise<string | null> => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { whatsappNumber: true },
    });
    return settings?.whatsappNumber || null;
  } catch (error) {
    console.error("[ayarlar] WhatsApp numarası okunamadı:", error);
    return null;
  }
});

export async function setWhatsappNumber(digits: string | null) {
  return prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { whatsappNumber: digits },
    create: { id: 1, whatsappNumber: digits },
  });
}
