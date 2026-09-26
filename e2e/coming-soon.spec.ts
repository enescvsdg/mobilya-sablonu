import { expect, test } from "@playwright/test";

import { brand } from "../src/config/brand";
import { PREVIEW_COOKIE } from "../src/lib/preview-cookies";
import { setComingSoon, TEST_WHATSAPP } from "./db";
import { ADMIN_URL, login } from "./helpers";

/**
 * "Yakında" modu: ziyaretçi yalnızca Yakında sahnesini görür, panel
 * kullanıcısı önizleme bağlantısıyla gerçek siteyi gezer.
 * Mod sitenin tamamını etkilediği için bu dosya sırayla ve diğer testler
 * bittikten sonra çalışır (playwright.config.ts, "yakinda" projesi).
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  await setComingSoon(true);
});

test.afterAll(async () => {
  await setComingSoon(false);
});

// Rusça sonda: döngüden sonraki kontroller son açılan sayfaya bakar.
const TITLES = { tr: "Çok Yakında", en: "Coming Soon", ar: "قريبًا", ru: "Скоро" } as const;

test("ziyaretçi her dilde yalnızca Yakında sahnesini görür", async ({ page }) => {
  for (const [locale, title] of Object.entries(TITLES)) {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page).toHaveTitle(`${brand.name} — ${title}`);
  }

  // Menü, alt bilgi, ürünler ve dil seçici yok; yalnızca Instagram (kullanıcı
  // adıyla) ve WhatsApp düğmeleri var. Dil tarayıcıya göre seçilir.
  await expect(page.getByRole("link", { name: "Koleksiyonlar" })).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: new RegExp(`Instagram.*@${brand.contact.instagramHandle}`) })
  ).toHaveAttribute("href", brand.contact.instagramUrl);
  // WhatsApp mesajı ziyaretçinin dilinde hazır gelir (son açılan sayfa Rusça).
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    `https://wa.me/${TEST_WHATSAPP}?text=${encodeURIComponent("Здравствуйте, можно получить информацию?")}`
  );

  // Sekme simgesi Yakında sayfasında da markanın simgesidir.
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

  // Arama motorları sayfayı /yakinda/... değil dilin ana sayfası olarak bilir.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ru$/);
});

test("Instagram ve WhatsApp düğmelerinin yazısı her dilde ve her genişlikte düğmenin içinde kalır", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Küçük telefon, iPhone, iPhone Pro Max, büyük Android, tablet, masaüstü.
  for (const width of [320, 393, 430, 440, 480, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of Object.keys(TITLES)) {
      await page.goto(`/${locale}`);
      await expect(
        page.getByRole("link", { name: new RegExp(`@${brand.contact.instagramHandle}`) })
      ).toBeVisible();
      const links = page.locator('a[href*="instagram"], a[href^="https://wa.me/"]');
      await expect(links).toHaveCount(2);
      for (const link of await links.all()) {
        const overflow = await link.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return Math.max(
            0,
            ...[...element.children].map((child) => {
              const part = child.getBoundingClientRect();
              return Math.max(part.right - box.right, box.left - part.left);
            }),
            box.right - document.documentElement.clientWidth,
            -box.left
          );
        });
        expect(overflow, `${locale}, ${width} px`).toBeLessThan(1);
      }
    }
  }
});

test("alt sayfalar ve dil öneksiz adresler ana sayfaya döner", async ({ page }) => {
  await page.goto("/tr/koleksiyonlar");
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES.tr);

  await page.goto("/en/urun/olmayan-bir-urun");
  await expect(page).toHaveURL(/\/en$/);

  // Sayfanın kendi adresi ziyaretçiye kapalıdır.
  await page.goto("/yakinda/tr");
  await expect(page).toHaveURL(/\/tr$/);
});

test("site haritası yalnızca dillerin ana sayfalarını listeler", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body.match(/<url>/g)).toHaveLength(Object.keys(TITLES).length);
  expect(body).not.toContain("/koleksiyonlar");
});

test("sahne açılır ve yazılar belirir; perde varsa dikey ekranda dikey görsel kullanılır", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tr");

  // Perde marka ayarıyla açılır (features.comingSoonCurtain); kapalıyken
  // sahnede görsel yoktur.
  const scene = page.locator('img[data-part="scene"]');
  if (brand.features.comingSoonCurtain) {
    await expect
      .poll(() => scene.evaluate((image: HTMLImageElement) => image.currentSrc))
      .toContain("dikey-acik");
  } else {
    await expect(scene).toHaveCount(0);
  }

  // Animasyon bitince başlık ve Instagram bağlantısı tam görünür olmalı.
  const opacityOf = (selector: string) =>
    page.locator(selector).first().evaluate((node) => getComputedStyle(node).opacity);
  await expect.poll(() => opacityOf("h1"), { timeout: 15_000 }).toBe("1");
  await expect.poll(() => opacityOf('a[href*="instagram"]'), { timeout: 15_000 }).toBe("1");
});

test("hareket azaltılınca sahne açık hâliyle hemen görünür", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(TITLES.en);
  expect(await heading.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(page.locator('img[data-part="curtain"]').first()).toBeHidden();
});

test("sahte ya da süresi dolmuş önizleme işe yaramaz", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: PREVIEW_COOKIE, value: "9999999999.sahte-imza", url: baseURL! },
  ]);
  await page.goto("/tr/koleksiyonlar");
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES.tr);

  await page.goto("/onizleme?t=1.gecersiz");
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES.tr);
});

test("panel kullanıcısı önizleme ile gerçek siteyi gezer ve çıkabilir", async ({
  page,
  baseURL,
}) => {
  await login(page);
  await page.goto(`${ADMIN_URL}/admin/onizleme`);

  await expect(page).toHaveURL(`${baseURL}/tr`);
  await expect(page.getByRole("status").filter({ hasText: "Önizleme modu" })).toBeVisible();

  await page.goto("/tr/koleksiyonlar");
  await expect(page).toHaveURL(/\/tr\/koleksiyonlar$/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(TITLES.tr);

  // Önizleme sahibi Yakında sayfasını da doğrudan açabilir.
  await page.goto("/yakinda/tr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES.tr);

  await page.goto("/tr");
  await page.getByRole("link", { name: "Çık" }).click();
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES.tr);
});

test("Süper Yönetici mağazayı panelden açar ve yeniden kapatır", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page);
  await expect(page.getByText("Yakında Sayfası", { exact: true })).toBeVisible();
  await expect(page.getByText("Açık", { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Mağazayı aç" }).click();
  await expect(page.getByText("Yakında sayfası kapatıldı, mağaza açık.")).toBeVisible();

  // Önizleme çerezi olmayan yeni bir ziyaretçi sitenin kendisini görür.
  const visitor = await browser.newContext({ baseURL });
  const visitorPage = await visitor.newPage();
  await visitorPage.goto("/tr/koleksiyonlar");
  await expect(visitorPage).toHaveURL(/\/tr\/koleksiyonlar$/);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Yakında sayfasını aç" }).click();
  await expect(page.getByText("Yakında sayfası açıldı.")).toBeVisible();

  await visitorPage.goto("/tr/koleksiyonlar");
  await expect(visitorPage).toHaveURL(/\/tr$/);
  await visitor.close();
});
