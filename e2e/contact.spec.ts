import { expect, test } from "@playwright/test";

test.describe("İletişim formu", () => {
  test("KVKK onayı işaretlenmeden gönderilemez", async ({ page }) => {
    await page.goto("/tr/iletisim");

    await page.getByLabel("Ad Soyad").fill("Test Kullanıcı");
    await page.getByLabel("E-posta").fill("test@example.com");
    await page.getByLabel("Mesajınız").fill("Merhaba, bilgi almak istiyorum.");

    const consent = page.locator("#consent");
    await expect(consent).not.toBeChecked();

    await page.getByRole("button", { name: "Gönder" }).click();

    // Tarayıcının kendi doğrulaması gönderimi engeller; sayfa aynı kalır.
    await expect(page.getByRole("button", { name: "Gönder" })).toBeVisible();
    await expect(consent).toBeFocused();
  });

  test("onay metni gizlilik politikasına bağlanır", async ({ page }) => {
    await page.goto("/tr/iletisim");

    const consentLink = page.getByRole("link", { name: "Gizlilik Politikası" }).first();
    await expect(consentLink).toHaveAttribute("href", "/tr/gizlilik-politikasi");
  });

  test("bal küpü alanı kullanıcıya görünmez", async ({ page }) => {
    await page.goto("/tr/iletisim");

    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveCount(1);
    await expect(honeypot).not.toBeVisible();
  });

  test("harita ve adres bilgisi gösterilir", async ({ page }) => {
    await page.goto("/tr/iletisim");

    await expect(page.getByRole("link", { name: /Yol Tarifi Al/ })).toBeVisible();
    await expect(page.locator("iframe")).toHaveAttribute("src", /maps\.google\.com/);
  });
});
