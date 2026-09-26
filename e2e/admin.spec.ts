import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_URL, login } from "./helpers";

test.describe("Panel erişimi", () => {
  test("panel normal alan adından görünmez", async ({ request }) => {
    for (const path of ["/admin", "/admin/login", "/admin/products", "/api/auth/session"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} gizli olmalı`).toBe(404);
    }
  });

  test("giriş yapılmadan panel sayfaları girişe yönlenir", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/products`);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("hatalı şifre hata mesajı gösterir", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/login`);
    await page.getByLabel("E-posta").fill(ADMIN_EMAIL);
    await page.getByLabel("Şifre", { exact: true }).fill("kesinlikle-yanlis-sifre");
    await page.getByRole("button", { name: /Giriş/ }).click();

    await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
  });

  test("art arda hatalı denemelerden sonra giriş kilitlenir", async ({ page }) => {
    // Gerçek hesabı kilitlememek için kayıtlı olmayan, teste özel bir adres.
    const email = `kilit-${Date.now()}-${test.info().project.name}@example.com`;
    // Başarılı giriş aynı bağlantının sayacını sıfırlar; paralel testlerin
    // girişleri bu testi bozmasın diye kendi IP'siyle gelir. (Vercel bu
    // başlığı kendisi yazar; canlıda ziyaretçi değiştiremez.)
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 250) + 1}`,
    });
    await page.goto(`${ADMIN_URL}/admin/login`);

    const submitButton = page.getByRole("button", { name: /Giriş/ });
    const tryLogin = async (password: string) => {
      await page.getByLabel("E-posta").fill(email);
      await page.getByLabel("Şifre", { exact: true }).fill(password);
      await submitButton.click();
      // Hata mesajı ilk denemeden sonra ekranda kalır; bir sonraki denemeye
      // geçmeden önce bu denemenin sunucudan dönmesi beklenir.
      await expect(submitButton).toHaveText("Giriş Yap");
    };

    for (let attempt = 1; attempt <= 5; attempt++) {
      await tryLogin(`yanlis-sifre-${attempt}`);
      await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
    }

    await tryLogin("yanlis-sifre-6");
    await expect(page.getByText(/Çok fazla hatalı deneme yapıldı/)).toBeVisible();
  });

  test("panel arama motorlarına kapalıdır", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/login`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
  });
});

test.describe("Panel ekranları", () => {
  // Oturum testler arasında paylaşılmaz; her test kendi girişini yapar.
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tüm menü sayfaları hatasız açılır", async ({ page }) => {
    const screens: [string, RegExp][] = [
      ["/admin", /^Panel$/],
      ["/admin/products", /Ürünler/],
      ["/admin/categories", /Kategoriler/],
      ["/admin/inquiries", /Gelen Talepler/],
      ["/admin/content", /Site Metinleri/],
      ["/admin/ceviriler", /Eksik Çeviriler/],
      ["/admin/languages", /Diller/],
      ["/admin/account", /Hesabım/],
      ["/admin/kullanicilar", /Kullanıcılar/],
      ["/admin/roller", /Roller/],
      ["/admin/islem-kaydi", /İşlem Kaydı/],
      ["/admin/site-ayarlari", /Site Ayarları/],
    ];

    for (const [path, heading] of screens) {
      await page.goto(`${ADMIN_URL}${path}`);
      await expect(page.locator("h1"), `${path} başlığı`).toContainText(heading);
    }
  });

  test("kategori eklenip düzenlenip silinebilir", async ({ page }) => {
    const name = `E2E Koleksiyon ${Date.now()}`;
    const renamed = `${name} (guncel)`;

    await page.goto(`${ADMIN_URL}/admin/categories`);
    await page.locator("#name_tr").fill(name);
    await page.getByRole("button", { name: "Kategori Ekle" }).click();
    // Diğer diller boş: kaydetmeden önce çeviri önerilir.
    const warning = page.getByRole("dialog", { name: "Bazı dillerde boş alanlar var" });
    await expect(warning).toContainText("EN, RU, AR");
    await warning.getByRole("button", { name: "Çevirmeden kaydet" }).click();

    // Kayıttan sonra düzenleme ekranına geçilir.
    await expect(page).toHaveURL(/\/admin\/categories\/[a-z0-9]+$/);
    await expect(page.locator("#name_tr")).toHaveValue(name);

    await page.locator("#name_tr").fill(renamed);
    // Diğer dillerde eski adın kopyası durduğu için bu kez sorulmaz.
    await page.getByRole("button", { name: "Güncelle" }).click();
    await expect(page.getByText("Kategori güncellendi.")).toBeVisible();
    await expect(warning).toHaveCount(0);

    await page.goto(`${ADMIN_URL}/admin/categories`);
    // `renamed` "(guncel)" gibi regex özel karakterleri içerir; adı
    // regex'e çevirmek yerine `hasText` ile düz metin eşleşmesi kullanılır.
    const row = page.getByRole("row").filter({ hasText: renamed });
    await expect(row).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button").last().click();
    await expect(page.getByText("Silindi.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: renamed })).toHaveCount(0);
  });

  test("dil ekranı varsayılan dili korur", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/languages`);

    // Rozet metni doğrudan hedeflenir; satır adları dil adlarını da içerir.
    const defaultBadge = page.getByText("Varsayılan", { exact: true });
    await expect(defaultBadge).toHaveCount(1);

    const defaultRow = page.getByRole("row").filter({ has: defaultBadge });
    await expect(defaultRow).toHaveCount(1);
    await expect(defaultRow).toContainText("Türkçe");
    // Sitenin ana dili (çevirilerin kaynağı) yayından kaldırılamaz, silinemez.
    await expect(defaultRow.getByRole("button", { name: "Yayından kaldır" })).toHaveCount(0);
    await expect(defaultRow.getByRole("button", { name: /dilini sil$/ })).toHaveCount(0);
  });

  test("site metinleri ekranı her blok için form gösterir", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/content`);

    await expect(page.getByText("Ana sayfa — Açılış bölümü")).toBeVisible();
    await expect(page.getByText("Hakkımızda — Giriş")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kaydet" }).first()).toBeVisible();
  });

  test("telefon boyutundaki fotoğraf küçültülüp yüklenir", async ({ page }, testInfo) => {
    // Sunucu isteği 4 MB ile sınırlı; 1 MB'ı aşan fotoğraflar tarayıcıda
    // küçültülmeden yüklenemiyordu.
    const photo = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: "#2e3b36",
        noise: { type: "gaussian", mean: 120, sigma: 30 },
      },
    })
      .jpeg({ quality: 80 })
      .toBuffer();
    expect(photo.length).toBeGreaterThan(1024 * 1024);

    // Paralel koşan iki proje aynı ürünün görsel listesini bozmasın.
    const product = testInfo.project.name === "mobile" ? /Luna/ : /Lina/;
    await page.goto(`${ADMIN_URL}/admin/products`);
    await page.getByRole("link", { name: product }).first().click();
    await expect(page).toHaveURL(/\/admin\/products\/[a-z0-9]+$/);

    const images = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "Görseli sil" }) });
    const before = await images.count();

    const input = page.locator("#images");
    await input.setInputFiles({ name: "telefon.jpg", mimeType: "image/jpeg", buffer: photo });
    await expect
      .poll(() => input.evaluate((element: HTMLInputElement) => element.files?.[0]?.type))
      .toBe("image/webp");

    await page.getByRole("button", { name: "Yükle" }).click();
    await expect(page.getByText("Görseller yüklendi.")).toBeVisible();
    await expect(images).toHaveCount(before + 1);

    // Eklenen görseli geri sil — demo ürün eski haline döner.
    page.once("dialog", (dialog) => dialog.accept());
    await images.last().getByRole("button", { name: "Görseli sil" }).click();
    await expect(images).toHaveCount(before);
  });

  test("çok sıkıştırılmış büyük fotoğraf da 1920 px'e indirilir", async ({ page }) => {
    // Küçültülmüş hâli asıl dosyadan büyük çıksa bile 4000 px'lik asıl
    // yüklenmez; sitede 1920 px'ten büyük görsel bulunmaz.
    const photo = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: "#2e3b36",
        noise: { type: "gaussian", mean: 120, sigma: 30 },
      },
    })
      .jpeg({ quality: 10 })
      .toBuffer();

    await page.goto(`${ADMIN_URL}/admin/products/new`);
    const input = page.locator("#images");
    await input.setInputFiles({ name: "sikistirilmis.jpg", mimeType: "image/jpeg", buffer: photo });
    await expect
      .poll(() =>
        input.evaluate(async (element: HTMLInputElement) => {
          const file = element.files?.[0];
          if (!file) return 0;
          const bitmap = await createImageBitmap(file);
          return Math.max(bitmap.width, bitmap.height);
        }),
        // 4000 px'lik fotoğrafın tarayıcıda küçültülmesi yük altında sürebilir.
        { timeout: 20_000 }
      )
      .toBe(1920);
  });

  test("silinemeyen kategori için Türkçe açıklama gösterilir", async ({ page }) => {
    // Üretim derlemesinde sunucudan fırlatılan hata mesajları gizlenir;
    // mesajın kullanıcıya ulaştığını gerçek derlemede doğrular.
    await page.goto(`${ADMIN_URL}/admin/categories`);
    const row = page.getByRole("row").filter({ hasText: "Koltuklar" });
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /sil/i }).click();
    await expect(
      page.getByText("Bu kategori silinemiyor — içinde ürün olan kategoriler silinemez.")
    ).toBeVisible();
  });

  test("ana sayfaya sığmayan öne çıkan ürün için uyarı gösterilir", async ({ page }, testInfo) => {
    // Demo verisinde 3 ürün öne çıkmış durumda; dördüncüsü ana sayfaya sığmaz.
    const product = testInfo.project.name === "mobile" ? "Lina" : "Oslo";
    await page.goto(`${ADMIN_URL}/admin/products`);
    const row = page.getByRole("row").filter({ hasText: product });
    const warning = page.getByRole("status").filter({ hasText: "ana sayfada görünmüyor" });

    await row.getByRole("button", { name: "Bu ürünü öne çıkar" }).click();
    await expect(warning).toBeVisible();

    // Test verisini geri al.
    await row.getByRole("button", { name: "Öne çıkanlardan kaldır" }).click();
    await expect(row.getByRole("button", { name: "Bu ürünü öne çıkar" })).toBeVisible();
  });

  test("şifre değiştirme mevcut şifreyi doğrular", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/account`);

    await page.getByLabel("Mevcut şifre").fill("yanlis-mevcut-sifre");
    await page.getByLabel("Yeni şifre", { exact: true }).fill("YeniSifre12345");
    await page.getByLabel("Yeni şifre (tekrar)").fill("YeniSifre12345");
    await page.getByRole("button", { name: /Onay kodu gönder|Şifreyi değiştir/ }).click();

    await expect(page.getByText("Mevcut şifre hatalı.")).toBeVisible();
  });

  test("yeni şifre ile tekrarı uyuşmazsa uyarır", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/account`);

    await page.getByLabel("Mevcut şifre").fill(ADMIN_PASSWORD);
    await page.getByLabel("Yeni şifre", { exact: true }).fill("YeniSifre12345");
    await page.getByLabel("Yeni şifre (tekrar)").fill("BaskaSifre12345");
    await page.getByRole("button", { name: /Onay kodu gönder|Şifreyi değiştir/ }).click();

    await expect(page.getByText("Yeni şifre ve tekrarı aynı değil.")).toBeVisible();
  });
});
