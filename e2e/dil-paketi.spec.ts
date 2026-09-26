import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  closePackageLanguages,
  deleteProducts,
  PACKAGE_LANGUAGES,
  setComingSoon,
  TEST_PREFIX,
  TEST_WHATSAPP,
} from "./db";
import { ADMIN_URL, login } from "./helpers";

/**
 * Dil paketi (Almanca, Fransızca, Farsça, Azerbaycan Türkçesi, İspanyolca,
 * İtalyanca): arayüz çevirileri hazır, diller kapalı başlar. Panelde
 * "Hazırlığa al" çeviri alanlarını açar, "Yayına al" dili ziyaretçiye açar.
 * Yayındaki diller sitenin tamamını (site haritası, hreflang, dil menüsü)
 * etkilediği için bu dosya en sonda ve sırayla çalışır.
 */
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await setComingSoon(false);
  await closePackageLanguages();
});

const createdProducts: string[] = [];

test.afterAll(async () => {
  await closePackageLanguages();
  await deleteProducts(createdProducts);
});

const languageRow = (page: Page, code: string) => page.getByTestId(`dil-${code}`);

/** Sayfadaki başlık ve bağlantıların (metinleriyle) ekrandan taşma miktarı. */
function overflowOf(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    let worst = 0;
    for (const element of document.querySelectorAll("h1, a")) {
      const range = document.createRange();
      range.selectNodeContents(element);
      for (const box of [element.getBoundingClientRect(), range.getBoundingClientRect()]) {
        if (box.width === 0) continue;
        worst = Math.max(worst, box.right - width, -box.left);
      }
    }
    return worst;
  });
}

async function openLanguageMenu(page: Page, label: string): Promise<Locator> {
  await page.locator("header").getByRole("button", { name: label }).click();
  return page.getByRole("menu");
}

test("kapalı diller ziyaretçiye görünmez", async ({ page, request }) => {
  for (const code of PACKAGE_LANGUAGES) {
    await page.goto(`/${code}/hakkimizda`);
    await expect(page, code).toHaveURL(/\/tr$/);
  }

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/en/hakkimizda");
  expect(sitemap).not.toMatch(/\/(de|fr|fa|az|es|it)[/<]/);

  await page.goto("/tr/hakkimizda");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveCount(0);

  const menu = await openLanguageMenu(page, "Dil");
  await expect(menu.getByRole("menuitem", { name: "English" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Deutsch" })).toHaveCount(0);
});

test("Hazırlık: panelde çeviri alanları açılır, site kapalı kalır, önizlemede görünür", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page);
  await page.goto(`${ADMIN_URL}/admin/languages`);
  const row = languageRow(page, "de");
  await expect(row).toContainText("Kapalı");
  await row.getByRole("button", { name: "Hazırlığa al" }).click();
  await expect(row).toContainText("Hazırlıkta");

  // Ürün formunda Almanca alanlar var; hazırlığa alınmayan dillerin yok.
  await page.goto(`${ADMIN_URL}/admin/products/new`);
  await expect(page.locator('[name="name_de"]')).toBeVisible();
  await expect(page.locator('[name="description_de"]')).toBeVisible();
  await expect(page.locator('[name="name_fr"]')).toHaveCount(0);

  // Almancası boş bırakılıp kaydedilen ürün "çevrilmiş" sayılmaz (Almanca
  // satırında Türkçe adın kopyası durur): tamam sayısı aynı kalır, toplam artar.
  const readiness = async () => {
    await page.goto(`${ADMIN_URL}/admin/languages`);
    const match = (await languageRow(page, "de").innerText()).match(/(\d+) \/ (\d+)/);
    return { done: Number(match?.[1]), total: Number(match?.[2]) };
  };
  const before = await readiness();
  await page.goto(`${ADMIN_URL}/admin/products/new`);
  await page.getByLabel("SKU *").fill(`${TEST_PREFIX}dil-${Date.now()}`);
  await page.getByLabel("Kategori *").selectOption({ index: 1 });
  await page.getByLabel("Yayında (sitede görünür)").uncheck();
  await page.locator('[name="name_tr"]').fill("E2E Dil Paketi Koltuğu");
  await page.getByRole("button", { name: "Ürünü Kaydet" }).click();
  await page
    .getByRole("dialog", { name: "Bazı dillerde boş alanlar var" })
    .getByRole("button", { name: "Çevirmeden kaydet" })
    .click();
  await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[^/]+$/);
  createdProducts.push(new URL(page.url()).pathname.split("/").pop()!);
  expect(await readiness()).toEqual({ done: before.done, total: before.total + 1 });

  // Tarayıcısı Almanca olan ziyaretçi de siteyi yayındaki bir dilde görür.
  const visitor = await browser.newContext({ baseURL, locale: "de-DE" });
  const visitorPage = await visitor.newPage();
  await visitorPage.goto("/");
  await expect(visitorPage).toHaveURL(/\/tr$/);
  await visitorPage.goto("/de");
  await expect(visitorPage).toHaveURL(/\/tr$/);
  await visitor.close();

  // Panel kullanıcısı önizlemede o dili görür.
  await page.goto(`${ADMIN_URL}/admin/languages`);
  const [preview] = await Promise.all([
    page.context().waitForEvent("page"),
    languageRow(page, "de").getByRole("link", { name: "Sitede önizle" }).click(),
  ]);
  await expect(preview).toHaveURL(/\/de$/);
  await expect(preview.locator("html")).toHaveAttribute("lang", "de");
  await expect(preview.locator("header").getByRole("link", { name: "Kollektionen" })).toBeVisible();

  // Farsça sağdan sola açılır.
  await preview.goto("/fa/iletisim");
  await expect(preview.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("تماس");
  await expect(preview.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    `https://wa.me/${TEST_WHATSAPP}?text=${encodeURIComponent("سلام، ممکن است اطلاعاتی دریافت کنم؟")}`
  );
});

test("paketteki her dilde Yakında sayfası küçük telefonda ekrana sığar", async ({ page }) => {
  await login(page);
  await page.goto(`${ADMIN_URL}/admin/onizleme`);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const code of PACKAGE_LANGUAGES) {
    await page.goto(`/yakinda/${code}`);
    await expect(page.locator("html")).toHaveAttribute("lang", code);
    await expect(page.getByRole("link", { name: "WhatsApp" })).toBeVisible();
    expect(await overflowOf(page), code).toBeLessThan(1);
  }
});

test("Yayına al: dil ziyaretçiye açılır ve Google'a bildirilir; yayından kaldırınca kapanır", async ({
  page,
  browser,
  baseURL,
  request,
}) => {
  await login(page);
  await page.goto(`${ADMIN_URL}/admin/languages`);
  const row = languageRow(page, "de");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Yayına al" }).click();
  await expect(row).toContainText("Yayında");

  const visitor = await browser.newContext({ baseURL, locale: "de-DE" });
  const visitorPage = await visitor.newPage();
  await visitorPage.goto("/");
  await expect(visitorPage).toHaveURL(/\/de$/);
  await expect(visitorPage.locator("html")).toHaveAttribute("lang", "de");
  const menu = await openLanguageMenu(visitorPage, "Sprache");
  await expect(menu.getByRole("menuitem", { name: "Deutsch" })).toBeVisible();
  await visitorPage.keyboard.press("Escape");

  expect(await (await request.get("/sitemap.xml")).text()).toContain("/de/hakkimizda");
  await visitorPage.goto("/tr/hakkimizda");
  await expect(visitorPage.locator('link[rel="alternate"][hreflang="de"]')).toHaveCount(1);

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Yayından kaldır" }).click();
  await expect(row).toContainText("Kapalı");

  await visitorPage.goto("/de");
  await expect(visitorPage).toHaveURL(/\/tr$/);
  await visitor.close();
});
