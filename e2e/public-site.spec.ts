import { expect, test } from "@playwright/test";

import { brand } from "../src/config/brand";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

test.describe("Genel site", () => {
  test("kök adres varsayılan dile yönlenir", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(tr|en|ru|ar)$/);
  });

  test("her dilde ana sayfa açılır ve navbar logosu görünür", async ({ page }) => {
    for (const locale of LOCALES) {
      await page.goto(`/${locale}`);
      const header = page.locator("header");
      await expect(header.getByText(brand.logo.primary, { exact: true })).toBeVisible();
      if (brand.logo.secondary) {
        await expect(header.getByText(brand.logo.secondary, { exact: true })).toBeVisible();
      }
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("Arapça site sağdan sola açılır, katalog Arapça listelenir", async ({ page }) => {
    await page.goto("/ar");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");
    // Logo Latin ve soldan sağa kalır.
    await expect(page.locator('header a[dir="ltr"]')).toContainText(brand.logo.primary);

    await page.goto("/ar/koleksiyonlar/sofas");
    await expect(page.locator("h1")).toHaveText("الأرائك");
    await expect(page.locator("main")).toContainText("أريكة Oslo لشخصين");

    await page.goto("/ar/urun/oslo-loveseat");
    await expect(page.locator("h1")).toHaveText("أريكة Oslo لشخصين");
    await expect(page.locator("main")).toContainText("الأبعاد");
    // Harf aralığı Arapça harflerin bağlantısını bozmasın diye sıfırlanır.
    const letterSpacing = await page
      .locator("main .tracking-widest")
      .first()
      .evaluate((element) => getComputedStyle(element).letterSpacing);
    expect(["0px", "normal"]).toContain(letterSpacing);
  });

  test("ana sayfa dışındaki sayfalar 200 döner", async ({ page }) => {
    const paths = [
      "/tr/koleksiyonlar",
      "/tr/hakkimizda",
      "/tr/iletisim",
      "/tr/gizlilik-politikasi",
      "/tr/kullanim-sartlari",
      "/en/koleksiyonlar",
      "/ru/hakkimizda",
      "/ar/koleksiyonlar",
      "/ar/gizlilik-politikasi",
    ];

    for (const path of paths) {
      const response = await page.request.get(path);
      expect(response.status(), `${path} durum kodu`).toBe(200);
    }
  });

  test("metinlerdeki marka yer tutucuları marka ayarıyla dolar", async ({ page }) => {
    // messages/*.json'daki {brandName}, {legalName}, {courtCity}
    // (src/i18n/brand-messages.ts) hiçbir sayfada ham hâliyle kalmamalı.
    for (const locale of LOCALES) {
      for (const path of ["", "/hakkimizda", "/gizlilik-politikasi", "/kullanim-sartlari"]) {
        await page.goto(`/${locale}${path}`);
        const text = await page.locator("body").innerText();
        expect(text, `/${locale}${path}`).not.toMatch(/\{(brandName|legalName|courtCity)\}/);
        expect(await page.title(), `/${locale}${path}`).not.toContain("{");
      }
    }

    await page.goto("/tr/hakkimizda");
    await expect(page.locator("h1")).toContainText(brand.name);
    await page.goto("/tr/gizlilik-politikasi");
    await expect(page.locator("main")).toContainText(brand.legalName);
    await page.goto("/tr/kullanim-sartlari");
    await expect(page.locator("main")).toContainText(`${brand.courtCity} mahkemeleri`);
  });

  test("dil değiştirici sayfayı koruyarak dili değiştirir", async ({ page, isMobile }) => {
    await page.goto("/tr/hakkimizda");

    // Mobilde dil değiştirici hamburger menüsünün içindedir; üstelik
    // header'ın backdrop-blur'ı fixed konumlandırma için bir containing
    // block oluşturduğundan panel document.body'ye portal edilir (bkz.
    // mobile-nav.tsx) — yani DOM'da <header> dışındadır, önce menü açılır.
    if (isMobile) {
      await page.getByRole("button", { name: "Menüyü aç" }).click();
    }

    const languageButton = isMobile
      ? page.getByRole("button", { name: "Dil" })
      : page.locator("header").getByRole("button", { name: "Dil" });
    await languageButton.click();

    await page.getByRole("menuitem", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/hakkimizda$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("footer yasal sayfalara bağlanır", async ({ page }) => {
    await page.goto("/tr");
    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Gizlilik Politikası" }).click();
    await expect(page).toHaveURL(/\/tr\/gizlilik-politikasi$/);
    await expect(page.locator("h1")).toContainText("Gizlilik");
  });

  test("olmayan sayfa markalı 404 gösterir ve noindex işaretlenir", async ({ page }) => {
    // Next.js 16: `[locale]/loading.tsx` bir Suspense sınırı açtığı için
    // yanıt akışa (streaming) başlar; headers zaten gönderildiğinden
    // `notFound()` HTTP durumunu artık 404'e çeviremez (bkz.
    // node_modules/next/dist/docs/.../loading.md #status-codes — bu proje
    // için AGENTS.md gereği eğitim verisi yerine buradan doğrulandı).
    // Next bunun yerine otomatik `noindex` ekler; arama motorları sayfayı
    // dizine almaz, dolayısıyla SEO açısından gerçek bir 404 ile eşdeğerdir.
    // Kesin durum kodu proxy katmanında her istekte DB sorgusu gerektirir —
    // dokümantasyon bunu önermiyor ("keep proxy checks fast").
    const response = await page.request.get("/tr/boyle-bir-sayfa-yok");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('name="robots" content="noindex"');

    await page.goto("/tr/boyle-bir-sayfa-yok");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana Sayfaya Dön" })).toBeVisible();
  });
});

test.describe("Güvenlik başlıkları", () => {
  test("temel başlıklar gönderilir", async ({ request }) => {
    const response = await request.get("/tr");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });
});
