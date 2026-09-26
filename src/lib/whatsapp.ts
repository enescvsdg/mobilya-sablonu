/**
 * WhatsApp numarası: panelde nasıl yazılırsa yazılsın (0532…, +90 532…,
 * 532…) WhatsApp'ın istediği biçime çevrilir: ülke koduyla, başında + ya
 * da 0 olmadan, yalnızca rakam (ör. 905551234567). wa.me bağlantısı bu
 * biçimi ister; başka biçimde "geçersiz numara" hatası verir.
 */

const TURKEY = "90";

/** Geçerliyse kaydedilecek biçimi, değilse null döndürür. */
export function normalizeWhatsappNumber(input: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    // Ülke koduyla yazılmış: +90 532 …
  } else if (digits.startsWith("00")) {
    // Uluslararası önek: 0090 532 …
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    // Türkiye'deki yazım: 0555 123 45 67
    digits = TURKEY + digits.slice(1);
  } else if (digits.length === 10 && /^[2-5]/.test(digits)) {
    // Başında 0 olmadan: 555 123 45 67
    digits = TURKEY + digits;
  }

  if (digits.startsWith(TURKEY)) {
    // Türkiye: 90 + 10 hane (cep 5xx, sabit 2xx–4xx).
    return /^90[2-5]\d{9}$/.test(digits) ? digits : null;
  }
  // Diğer ülkeler: E.164, en fazla 15 hane.
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/** Ekranda gösterim: +90 555 123 45 67 */
export function formatWhatsappNumber(digits: string) {
  const match = /^90(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits);
  return match ? `+90 ${match.slice(1).join(" ")}` : `+${digits}`;
}

/** Tıklayınca sohbeti açan ve mesajı hazır yazan bağlantı. */
export function whatsappLink(digits: string, message: string) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
