import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { createUntranslatedProduct, deleteProducts, TEST_PREFIX } from "./db";
import { ADMIN_URL, login } from "./helpers";
import { slugify } from "../src/lib/slugify";

/**
 * Otomatik çeviri. Testlerde Google'a gidilmez (TRANSLATION_FAKE,
 * playwright.config.ts): çeviri, metnin başına dil kodu eklenmiş hâlidir.
 */

// Diğer projelerin (mobil, iPhone) testleri aynı anda çalışabilir; her
// dosya yalnızca kendi açtığı ürünleri siler.
const createdProducts: string[] = [];

test.afterAll(async () => {
  await deleteProducts(createdProducts);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

const saveWarning = (page: Page) =>
  page.getByRole("dialog", { name: "Bazı dillerde boş alanlar var" });

const field = (scope: Locator | Page, name: string) =>
  scope.locator(`[name="${name}"]`);

test("ürün formu: Türkçeden çevir boşları doldurur, doluların üzerine sormadan yazmaz", async ({
  page,
}) => {
  const suffix = randomUUID().slice(0, 6);
  const name = `E2E Çeviri Koltuğu ${suffix}`;
  // Adres (slug) dil başına benzersizdir; paralel projeler çakışmasın.
  const englishName = `Custom English ${suffix}`;
  const description = "Kadife döşemeli koltuk.\n\nİkinci paragraf.";

  await page.goto(`${ADMIN_URL}/admin/products/new`);
  await page.getByLabel("SKU *").fill(`${TEST_PREFIX}form-${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Kategori *").selectOption({ index: 1 });
  await page.getByLabel("Yayında (sitede görünür)").uncheck();
  await field(page, "name_tr").fill(name);
  await field(page, "description_tr").fill(description);
  await field(page, "name_en").fill(englishName);

  await page.getByRole("button", { name: "Türkçeden çevir" }).click();
  const choice = page.getByRole("group", { name: "Dolu alanlar" });
  await expect(choice).toContainText("1 alan zaten dolu, 5 alan boş.");
  await choice.getByRole("button", { name: "Yalnız boş alanları doldur" }).click();

  await expect(page.getByRole("status").filter({ hasText: "alan çevrildi" })).toHaveText(
    "5 alan çevrildi (EN, RU, AR). Sarı alanları kontrol edip kaydedin."
  );
  await expect(field(page, "name_en")).toHaveValue(englishName);
  await expect(field(page, "description_en")).toHaveValue(`EN: ${description}`);
  await expect(field(page, "name_ru")).toHaveValue(`RU: ${name}`);
  await expect(field(page, "name_ar")).toHaveValue(`AR: ${name}`);
  await expect(field(page, "name_ar")).toHaveClass(/bg-amber-50/);

  // Çeviriler kaydedilene kadar yalnızca formdadır.
  await page.getByRole("button", { name: "Ürünü Kaydet" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[^/]+$/);
  createdProducts.push(new URL(page.url()).pathname.split("/").pop()!);
  await expect(field(page, "name_ar")).toHaveValue(`AR: ${name}`);
  await expect(field(page, "description_ru")).toHaveValue(`RU: ${description}`);
  await expect(field(page, "slug_en")).toHaveValue(slugify(englishName));

  // Her şey doluyken üzerine yazmak için ayrıca onay istenir.
  await field(page, "slug_ru").fill(`ozel-rusca-adres-${suffix}`);
  await page.getByRole("button", { name: "Türkçeden çevir" }).click();
  await expect(choice).toContainText("6 alan zaten dolu; boş alan yok.");
  await expect(choice.getByRole("button", { name: "Yalnız boş alanları doldur" })).toHaveCount(0);
  await choice.getByRole("button", { name: "Dolu alanların da üzerine yaz" }).click();
  await expect(field(page, "name_en")).toHaveValue(`EN: ${name}`);
  // Eski isimden üretilmiş adres boşalır (kaydedince yeni isimden üretilir);
  // elle yazılmış adres korunur.
  await expect(field(page, "slug_en")).toHaveValue("");
  await expect(field(page, "slug_ru")).toHaveValue(`ozel-rusca-adres-${suffix}`);
});

test("kaydederken boş diller hatırlatılır; Önce çevir boşları doldurur", async ({ page }) => {
  const name = `E2E Hatırlatma ${randomUUID().slice(0, 6)}`;

  await page.goto(`${ADMIN_URL}/admin/products/new`);
  await page.getByLabel("SKU *").fill(`${TEST_PREFIX}uyari-${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Kategori *").selectOption({ index: 1 });
  await page.getByLabel("Yayında (sitede görünür)").uncheck();
  await field(page, "name_tr").fill(name);
  await field(page, "description_tr").fill("Hatırlatma açıklaması.");

  await page.getByRole("button", { name: "Ürünü Kaydet" }).click();
  const warning = saveWarning(page);
  await expect(warning).toContainText("6 alanın Türkçesi yazılı ama EN, RU, AR dilinde boş.");
  await warning.getByRole("button", { name: "Önce çevir" }).click();

  // Çeviri forma yazılır, kayıt kullanıcıya bırakılır.
  await expect(warning).toHaveCount(0);
  await expect(field(page, "name_en")).toHaveValue(`EN: ${name}`);
  await expect(field(page, "description_ar")).toHaveValue("AR: Hatırlatma açıklaması.");
  await expect(page).toHaveURL(/\/admin\/products\/new$/);

  // Artık boş dil yok: sorulmadan kaydedilir.
  await page.getByRole("button", { name: "Ürünü Kaydet" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[^/]+$/);
  createdProducts.push(new URL(page.url()).pathname.split("/").pop()!);
  await expect(field(page, "name_ru")).toHaveValue(`RU: ${name}`);
});

test("varyant adları ve alt metinler çevrilir; taslak ürün sitede önizlenir", async ({
  page,
  browser,
  baseURL,
}) => {
  const name = `E2E Taslak Koltuk ${randomUUID().slice(0, 6)}`;
  const id = await createUntranslatedProduct({
    name,
    description: "Taslak açıklaması.",
    variants: ["Lacivert Kadife"],
    imageAlt: "Kadife koltuk önden",
  });
  createdProducts.push(id);

  // Panel ana sayfası eksik çevirileri hatırlatır.
  await page.goto(`${ADMIN_URL}/admin`);
  await page.getByRole("main").getByRole("link", { name: /Eksik Çeviriler/ }).click();
  await expect(page.getByTestId(`eksik-ceviri-product:${id}`)).toContainText(
    "EN: isim, açıklama, 1 varyant adı, 1 alt metin"
  );

  await page.goto(`${ADMIN_URL}/admin/products/${id}`);
  const variantField = (code: string) => page.locator("li").locator(`[name="name_${code}"]`);
  await expect(variantField("en")).toHaveValue("");
  await expect(page.getByLabel("Alt metin (EN)")).toHaveValue("");

  await page.getByRole("button", { name: "Boş dilleri Türkçeden çevir" }).first().click();
  await expect(page.getByText("6 alan çevrilip kaydedildi (EN, RU, AR).")).toBeVisible();
  await expect(variantField("en")).toHaveValue("EN: Lacivert Kadife");
  await expect(variantField("ar")).toHaveValue("AR: Lacivert Kadife");
  await expect(page.getByLabel("Alt metin (RU)")).toHaveValue("RU: Kadife koltuk önden");
  // Ürün formuna dokunulmaz.
  await expect(page.locator("#name_en")).toHaveValue(name);

  // Elle düzeltilen varyant adı kaydedilir.
  await variantField("en").fill("Navy Velvet");
  await page
    .locator("li")
    .filter({ has: page.locator('[name="name_en"]') })
    .getByRole("button", { name: "Kaydet" })
    .click();
  await expect(page.getByText("Varyant güncellendi.")).toBeVisible();

  // Taslak ürün yalnızca panelden açılan önizlemede görünür.
  const [preview] = await Promise.all([
    page.context().waitForEvent("page"),
    page.getByRole("link", { name: "Taslağı sitede önizle" }).click(),
  ]);
  await expect(preview).toHaveURL(/\/tr\/urun\/[a-z0-9-]+$/);
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(preview.getByRole("status").filter({ hasText: "Taslak" })).toContainText(
    "bu ürün yayında değil"
  );
  await expect(preview.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const slug = new URL(preview.url()).pathname.split("/").pop();
  await preview.goto(`/en/urun/${slug}`);
  await expect(preview.getByText("Navy Velvet")).toBeVisible();
  await expect(preview.locator('main img[alt="EN: Kadife koltuk önden"]').first()).toBeVisible();

  // Ziyaretçi (önizleme çerezi yok) "bulunamadı" sayfasını görür. Durum
  // kodu akış nedeniyle 200'dür, sayfa noindex taşır (public-site.spec.ts).
  const visitor = await browser.newContext({ baseURL });
  const visitorPage = await visitor.newPage();
  await visitorPage.goto(`/tr/urun/${slug}`);
  await expect(visitorPage.getByText("404")).toBeVisible();
  await expect(visitorPage.getByText(name)).toHaveCount(0);
  await expect(visitorPage.getByText("Taslak")).toHaveCount(0);
  await visitor.close();
});

test("Türkçe alanlar boşsa çeviri yapılmaz", async ({ page }) => {
  await page.goto(`${ADMIN_URL}/admin/categories`);
  await page.getByRole("button", { name: "Türkçeden çevir" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Türkçe" })).toHaveText(
    "Önce Türkçe alanları doldurun."
  );
});

test("site metni: her bölümün kendi çeviri düğmesi vardır", async ({ page }) => {
  await page.goto(`${ADMIN_URL}/admin/content`);
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Ana sayfa — Açılış bölümü" }) });

  for (const code of ["tr", "en", "ru", "ar"]) {
    await field(form, `title_${code}`).fill("");
    await field(form, `body_${code}`).fill("");
  }
  await field(form, "title_tr").fill("Zamansız zarafet");
  await form.getByRole("button", { name: "Türkçeden çevir" }).click();

  await expect(form.getByRole("status").filter({ hasText: "alan çevrildi" })).toContainText(
    "3 alan çevrildi (EN, RU, AR)"
  );
  await expect(field(form, "title_ru")).toHaveValue("RU: Zamansız zarafet");
  await expect(field(form, "body_en")).toHaveValue("");
});

test("eksik çeviriler ekranı boş dilleri çevirip kaydeder", async ({ page }) => {
  const name = `E2E Toplu Çeviri ${randomUUID().slice(0, 6)}`;
  const id = await createUntranslatedProduct({ name, description: "Toplu çeviri açıklaması." });
  createdProducts.push(id);

  await page.goto(`${ADMIN_URL}/admin/ceviriler`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Eksik Çeviriler");
  const row = page.getByTestId(`eksik-ceviri-product:${id}`);
  await expect(row).toContainText(name);
  await expect(row).toContainText("EN: isim, açıklama · RU: isim, açıklama · AR: isim, açıklama");

  await row.getByRole("button", { name: "Çevir" }).click();
  await expect(row).toContainText("6 alan çevrildi (EN, RU, AR).");

  await row.getByRole("link", { name: "Kontrol et" }).click();
  await expect(page).toHaveURL(`${ADMIN_URL}/admin/products/${id}`);
  await expect(field(page, "name_en")).toHaveValue(`EN: ${name}`);
  await expect(field(page, "description_ar")).toHaveValue("AR: Toplu çeviri açıklaması.");
  // Türkçe isimden üretilmiş adres, çevrilen isimden yeniden üretilir.
  await expect(field(page, "slug_en")).toHaveValue(slugify(`EN: ${name}`));
  await expect(field(page, "slug_tr")).toHaveValue(slugify(name));

  await page.goto(`${ADMIN_URL}/admin/ceviriler`);
  await expect(page.getByTestId(`eksik-ceviri-product:${id}`)).toHaveCount(0);
});

test("ücretsiz sınır dolunca kayıt değişmez ve sebebi gösterilir", async ({ page }) => {
  const name = `E2E Kota ${randomUUID().slice(0, 6)}`;
  const id = await createUntranslatedProduct({ name, description: "Sınır testi [kota-dolu]" });
  createdProducts.push(id);

  await page.goto(`${ADMIN_URL}/admin/ceviriler`);
  const row = page.getByTestId(`eksik-ceviri-product:${id}`);
  await row.getByRole("button", { name: "Çevir" }).click();
  await expect(row).toContainText("ücretsiz çeviri sınırı doldu");

  await page.goto(`${ADMIN_URL}/admin/products/${id}`);
  await expect(field(page, "name_en")).toHaveValue(name);
});
