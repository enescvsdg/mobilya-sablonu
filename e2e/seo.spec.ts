import { expect, test } from "@playwright/test";

import { brand } from "../src/config/brand";

test.describe("SEO", () => {
  test("robots.txt admin'i kapatır ve sitemap'i bildirir", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap:");
    expect(body).toContain("/sitemap.xml");
  });

  test("sitemap dört dili ve hreflang alternatiflerini içerir", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const body = await response.text();
    for (const locale of ["tr", "en", "ru", "ar"]) {
      expect(body).toContain(`/${locale}/koleksiyonlar`);
      expect(body).toContain(`hreflang="${locale}"`);
    }
    expect(body).toContain("/tr/gizlilik-politikasi");
  });

  test("sitemap ürün görsellerini de bildirir (Google Görseller)", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(body).toMatch(/<image:loc>https?:\/\/[^<]+\/images\/products\/[^<]+<\/image:loc>/);
  });

  test("paylaşım görseli üretilir", async ({ request }) => {
    const response = await request.get("/og.png");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("ana sayfada canonical, hreflang ve JSON-LD bulunur", async ({ page }) => {
    await page.goto("/tr");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/tr$/
    );

    for (const locale of ["tr", "en", "ru", "ar", "x-default"]) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${locale}"]`)
      ).toHaveCount(1);
    }

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    const data = JSON.parse(jsonLd ?? "{}");
    expect(data["@type"]).toBe("FurnitureStore");
    expect(data.name).toBe(brand.name);
    // Telefon, panelde ayarlı WhatsApp hattıdır.
    expect(data.telephone).toMatch(/^\+\d{8,15}$/);
  });

  test("alt sayfa başlığı marka şablonunu kullanır", async ({ page }) => {
    await page.goto("/en/koleksiyonlar");
    await expect(page).toHaveTitle(`Collections | ${brand.name}`);

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Collections"
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "Collections"
    );
  });

  test("ürün sayfasında marka adı başlıkta bir kez geçer", async ({ page }) => {
    // SEO başlığı panelde "| <marka>" ile girilse de girilmese de
    // sekme başlığı aynı çıkmalı.
    await page.goto("/tr/urun/nova-koltuk");
    await expect(page).toHaveTitle(`Nova Koltuk | ${brand.name}`);
  });

  test("ürün sayfasının yapısal verisi: fiyatsız teklif yok, içerik yolu var", async ({ page }) => {
    await page.goto("/en/urun/nova-armchair");
    const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
      (text) => JSON.parse(text)
    );

    const product = blocks.find((block) => block["@type"] === "Product");
    expect(product).toBeTruthy();
    // Fiyat gösterilmediği için "offers" yok; olsaydı Search Console hata verirdi.
    expect(product).not.toHaveProperty("offers");

    const breadcrumb = blocks.find((block) => block["@type"] === "BreadcrumbList");
    const names = breadcrumb.itemListElement.map((item: { name: string }) => item.name);
    expect(names[0]).toBe("Home");
    expect(names.at(-1)).toBe(product.name);
    expect(breadcrumb.itemListElement.at(-1).item).toMatch(/\/en\/urun\/nova-armchair$/);
  });

  test("statik dosyalar dil önekine yönlendirilmez", async ({ request }) => {
    for (const path of ["/robots.txt", "/sitemap.xml", "/og.png", "/favicon.ico"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} yönlendirilmemeli`).toBe(200);
    }
  });

  test("sekme ve ana ekran simgeleri tanımlıdır ve açılır", async ({ page, request }) => {
    await page.goto("/tr");
    const icon = page.locator('link[rel="icon"][type="image/png"]');
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(icon).toHaveCount(1);
    await expect(appleIcon).toHaveCount(1);

    for (const href of [await icon.getAttribute("href"), await appleIcon.getAttribute("href")]) {
      const response = await request.get(href ?? "", { maxRedirects: 0 });
      expect(response.status(), `${href}`).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });
});
