/**
 * Panel butonlarının çağırdığı sunucu işlemlerinin sonucu.
 *
 * Beklenen hatalar (ör. "içinde ürün olan kategori silinemez") fırlatılmaz,
 * döndürülür: Next.js üretimde sunucu işlemlerinden fırlatılan hataların
 * mesajını güvenlik gereği gizler ve kullanıcı Türkçe açıklama yerine
 * "Minified React error" gibi anlamsız bir metin görür.
 */
export type ActionResult = { error?: string } | void;

/** Beklenmeyen bir hata olduğunda (bağlantı kopması vb.) gösterilen mesaj. */
export const UNEXPECTED_ERROR_MESSAGE =
  "İşlem tamamlanamadı. Sayfayı yenileyip tekrar deneyin.";
