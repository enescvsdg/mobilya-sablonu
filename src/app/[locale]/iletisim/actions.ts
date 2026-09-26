"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { hashClientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { notifyNewInquiry } from "@/lib/notify";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(4000),
  productId: z.string().trim().optional(),
  locale: z.string(),
  // KVKK açık rızası: onay kutusu işaretlenmeden kayıt oluşturulmaz.
  consent: z.literal("yes"),
});

const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_PER_WINDOW = 5;

export type ContactState = { success?: boolean; error?: string } | undefined;

export async function submitInquiryAction(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: gerçek kullanıcıya görünmeyen alan doluysa bot demektir.
  // Bota başarılı olduğunu düşündürüp sessizce yok sayıyoruz.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { success: true };
  }

  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
    productId: formData.get("productId") || undefined,
    locale: formData.get("locale"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { error: "invalid" };
  }

  const { name, email, phone, message, productId, locale } = parsed.data;
  const ipHash = hashClientIp(await headers());

  if (ipHash) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await prisma.inquiry.count({
      where: { ipHash, createdAt: { gte: since } },
    });
    if (recentCount >= RATE_LIMIT_MAX_PER_WINDOW) {
      return { error: "rateLimited" };
    }
  }

  let productName: string | null = null;
  try {
    await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        message,
        productId: productId || undefined,
        languageCode: locale,
        ipHash,
      },
    });

    if (productId) {
      const translation = await prisma.productTranslation.findUnique({
        where: { productId_languageCode: { productId, languageCode: locale } },
        select: { name: true },
      });
      productName = translation?.name ?? null;
    }
  } catch {
    return { error: "failed" };
  }

  await notifyNewInquiry({ name, email, phone, message, productName, locale });

  return { success: true };
}
