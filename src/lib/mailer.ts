import "server-only";
import { appendFile } from "node:fs/promises";
import { Resend } from "resend";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Testlerde e-postalar gönderilmez, bu dosyaya satır satır yazılır
 * (playwright.config.ts). Canlıda bu yol hiçbir zaman kullanılmaz.
 */
function testOutbox() {
  const file = process.env.EMAIL_OUTBOX_FILE;
  return file && process.env.VERCEL_ENV !== "production" ? file : null;
}

/** Şifre sıfırlama, onay kodu ve davet e-postaları gönderilebilir mi? */
export function isEmailConfigured() {
  return Boolean(
    testOutbox() || (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
  );
}

/** Gönderildiyse true; ayar eksikse ya da Resend hata verirse false. */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const outbox = testOutbox();
  if (outbox) {
    await appendFile(outbox, `${JSON.stringify({ ...email, sentAt: new Date() })}\n`);
    return true;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, ...email });
    if (error) {
      console.error("[e-posta] Gönderilemedi:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[e-posta] Gönderilemedi:", error);
    return false;
  }
}
