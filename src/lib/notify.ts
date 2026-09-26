import "server-only";
import { Resend } from "resend";

import { siteConfig } from "@/lib/site-config";

type InquiryNotification = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  productName?: string | null;
  locale: string;
};

// RESEND_API_KEY tanımlı değilse (local geliştirme) sessizce atlanır —
// form gönderimi hiçbir zaman e-posta yüzünden başarısız olmaz.
export async function notifyNewInquiry(inquiry: InquiryNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? siteConfig.email;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      replyTo: inquiry.email,
      subject: inquiry.productName
        ? `Yeni teklif talebi: ${inquiry.productName}`
        : "Yeni iletişim mesajı",
      text: [
        `Gönderen: ${inquiry.name} <${inquiry.email}>`,
        inquiry.phone ? `Telefon: ${inquiry.phone}` : null,
        inquiry.productName ? `Ürün: ${inquiry.productName}` : null,
        `Dil: ${inquiry.locale}`,
        "",
        inquiry.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (error) {
    // Bildirim gönderilemese bile talep veritabanına kaydedilmiş olur.
    console.error("Inquiry notification failed:", error);
  }
}
