import { expect, test } from "@playwright/test";

import { TEST_WHATSAPP } from "./db";
import { ADMIN_URL, login } from "./helpers";

/**
 * WhatsApp bağlantısı: numara panelde (Site Ayarları) tutulur; testlerde
 * global-setup örnek hattı (TEST_WHATSAPP) yazar. Testler numarayı
 * değiştirmez; paralel projeler aynı veritabanını kullanır.
 */

const WA_LINK = /^https:\/\/wa\.me\/\d{8,15}\?text=/;

/** Bağlantının hazır mesajı (adresin sonu). */
const endsWithMessage = (message: string) =>
  new RegExp(`\\?text=${encodeURIComponent(message).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);

test("İletişim sayfasında Bize Ulaşın altında WhatsApp bağlantısı, mesaj ziyaretçinin dilinde", async ({
  page,
}) => {
  await page.goto("/tr/iletisim");
  const link = page.getByRole("link", { name: "WhatsApp" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", WA_LINK);
  await expect(link).toHaveAttribute("href", endsWithMessage("Merhaba, bilgi alabilir miyim?"));
  await expect(link).toHaveAttribute("target", "_blank");

  await page.goto("/ar/iletisim");
  const arabic = page.getByRole("link", { name: "WhatsApp" });
  await expect(arabic).toHaveAttribute(
    "href",
    endsWithMessage("مرحبًا، هل يمكنني الحصول على معلومات؟")
  );

  // Sitede başka bir yerde WhatsApp bağlantısı yok.
  await page.goto("/tr");
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
});

test("Site Ayarları: numara WhatsApp biçimine çevrilir, hatalı numara reddedilir", async ({
  page,
}) => {
  await login(page);
  await page.goto(`${ADMIN_URL}/admin/site-ayarlari`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Site Ayarları");

  const input = page.getByLabel("WhatsApp numarası");
  await input.fill("12345");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Numara geçersiz.")).toBeVisible();

  // Test hattı, farklı yazımla: aynı biçime çevrilir.
  await input.fill("0555 123 45 67");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("WhatsApp numarası kaydedildi.")).toBeVisible();
  const tryLink = page.getByRole("link", { name: /WhatsApp'ta dene/ });
  await expect(tryLink).toContainText("+90 555 123 45 67");
  await expect(tryLink).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${TEST_WHATSAPP}\\?text=`));
});
