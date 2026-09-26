import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { codeIn, createAdmin, lastEmailTo, linkIn, uniqueEmail } from "./db";
import { ADMIN_URL, loginAs } from "./helpers";

// Testler kendi hesaplarını açar; asıl yönetici hesabının şifresine dokunmaz.
// E-postalar gönderilmez, test kutusuna yazılır (playwright.config.ts).
// Açılan hesaplar bir sonraki çalıştırmanın başında silinir (global-setup.ts);
// testler paralel koştuğu için burada silinmez.

/** Sunucunun bu adrese yazdığı son e-postayı bekler. */
async function waitForEmail(to: string, subject: string) {
  await expect
    .poll(async () => (await lastEmailTo(to, subject)) !== null, { message: `${subject} e-postası` })
    .toBe(true);
  return (await lastEmailTo(to, subject))!;
}

async function fillNewPassword(page: Page, password: string) {
  await page.getByLabel("Yeni şifre", { exact: true }).fill(password);
  await page.getByLabel("Yeni şifre (tekrar)").fill(password);
}

async function expectLoginFails(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Giriş/ }).click();
  await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
}

test.describe("Giriş ve şifre", () => {
  test("göz simgesi yazılan şifreyi gösterip gizler", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/login`);
    const input = page.getByLabel("Şifre", { exact: true });
    await input.fill("gizli-sifre");
    await expect(input).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Şifreyi göster" }).click();
    await expect(input).toHaveAttribute("type", "text");
    await expect(input).toHaveValue("gizli-sifre");

    await page.getByRole("button", { name: "Şifreyi gizle" }).click();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("şifremi unuttum: e-postadaki bağlantı tek kullanımlıktır ve oturumları kapatır", async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail("sifirla");
    const oldPassword = "Eski-Sifre-12345";
    const newPassword = "Yeni-Sifre-67890";
    await createAdmin({ email, password: oldPassword });

    // Başka bir cihazda açık kalmış oturum.
    const otherDevice = await browser.newContext();
    const otherPage = await otherDevice.newPage();
    await loginAs(otherPage, email, oldPassword);

    await page.goto(`${ADMIN_URL}/admin/login`);
    await page.getByRole("link", { name: "Şifremi unuttum" }).click();
    await expect(page).toHaveURL(/\/admin\/sifremi-unuttum$/);
    await page.getByLabel("E-posta").fill(email);
    await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();
    await expect(page.getByText(/kayıtlıysa şifre sıfırlama bağlantısı gönderildi/)).toBeVisible();

    const link = linkIn(await waitForEmail(email, "şifrenizi sıfırlayın"));
    expect(link).toContain("/admin/sifre-sifirla?t=");

    await page.goto(link);
    await expect(page.getByText(email)).toBeVisible();
    await fillNewPassword(page, newPassword);
    await page.getByRole("button", { name: "Şifremi kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/login\?durum=sifre$/);
    await expect(page.getByText("Şifreniz değişti.")).toBeVisible();
    await waitForEmail(email, "şifreniz değiştirildi");

    // Bağlantı ikinci kez kullanılamaz.
    await page.goto(link);
    await expect(page.getByText("Bağlantı geçersiz")).toBeVisible();

    // Diğer cihazdaki oturum kapanmıştır.
    await otherPage.goto(`${ADMIN_URL}/admin`);
    await expect(otherPage).toHaveURL(/\/admin\/login\?durum=oturum$/);
    await expect(otherPage.getByText("Oturumunuz sona erdi.")).toBeVisible();
    await otherDevice.close();

    await expectLoginFails(page, email, oldPassword);
    await loginAs(page, email, newPassword);
  });

  test("kayıtlı olmayan adres için de aynı yanıt verilir", async ({ page }) => {
    const email = uniqueEmail("yok");
    await page.goto(`${ADMIN_URL}/admin/sifremi-unuttum`);
    await page.getByLabel("E-posta").fill(email);
    await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();
    await expect(page.getByText(/kayıtlıysa şifre sıfırlama bağlantısı gönderildi/)).toBeVisible();
    expect(await lastEmailTo(email)).toBeNull();
  });

  test("Hesabım: şifre e-postadaki kodla değişir", async ({ page }) => {
    const email = uniqueEmail("degistir");
    const oldPassword = "Eski-Sifre-12345";
    const newPassword = "Yeni-Sifre-67890";
    await createAdmin({ email, password: oldPassword });
    await loginAs(page, email, oldPassword);

    await page.goto(`${ADMIN_URL}/admin/account`);
    await page.getByLabel("Mevcut şifre").fill(oldPassword);
    await fillNewPassword(page, newPassword);
    await page.getByRole("button", { name: "Onay kodu gönder" }).click();
    await expect(page.getByText(/6 haneli bir onay kodu gönderildi/)).toBeVisible();

    const code = codeIn(await waitForEmail(email, "onay kodu"));
    const codeInput = page.getByLabel("Onay kodu");
    const confirm = page.getByRole("button", { name: "Onayla ve şifreyi değiştir" });

    await codeInput.fill(code === "111111" ? "222222" : "111111");
    await confirm.click();
    await expect(page.getByText(/Kod hatalı/)).toBeVisible();

    await codeInput.fill(code);
    await confirm.click();
    await expect(page).toHaveURL(/\/admin\/login\?durum=sifre$/);

    await expectLoginFails(page, email, oldPassword);
    await loginAs(page, email, newPassword);
  });
});

test.describe("Kullanıcılar ve roller", () => {
  test("Süper Yönetici kendi hesabını silemez ve pasif yapamaz", async ({ page }) => {
    const email = uniqueEmail("kendi");
    const password = "Super-Sifre-12345";
    await createAdmin({ email, password, superAdmin: true, name: "E2E Kendi" });
    await loginAs(page, email, password);

    await page.goto(`${ADMIN_URL}/admin/kullanicilar`);
    const row = page.getByRole("row").filter({ hasText: email });
    await expect(row.getByText("Siz", { exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: /sil/ })).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Pasif yap" })).toHaveCount(0);
  });

  test("rol oluşturulur, çalışan davet edilir ve yalnızca yetkili olduğu bölümleri görür", async ({
    page,
    browser,
  }) => {
    const suffix = randomUUID().slice(0, 6);
    const superEmail = uniqueEmail("super");
    const superName = `E2E Süper ${suffix}`;
    const password = "Super-Sifre-12345";
    await createAdmin({ email: superEmail, password, superAdmin: true, name: superName });
    await loginAs(page, superEmail, password);

    // 1. Rol: Ürünleri görür, talepleri düzenler; başka bir şey yok.
    const roleName = `E2E Rol ${suffix}`;
    await page.goto(`${ADMIN_URL}/admin/roller/yeni`);
    await page.getByLabel("Rol adı").fill(roleName);
    await page.getByLabel("Ürünler: Görüntüle").check();
    await page.getByLabel("Talepler: Düzenle").check();
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/roller$/);
    const roleRow = page.getByRole("row").filter({ hasText: roleName });
    await expect(roleRow.getByText("Ürünler: Görüntüle")).toBeVisible();
    await expect(roleRow.getByText("Talepler: Düzenle")).toBeVisible();

    // 2. Davet.
    const staffEmail = uniqueEmail("calisan");
    const staffName = `E2E Çalışan ${suffix}`;
    const staffPassword = "Calisan-Sifre-12345";
    await page.goto(`${ADMIN_URL}/admin/kullanicilar`);
    await page.getByLabel("Ad Soyad").fill(staffName);
    await page.getByLabel("E-posta").fill(staffEmail);
    await page.getByLabel("Rol", { exact: true }).selectOption({ label: roleName });
    await page.getByRole("button", { name: "Davet gönder" }).click();
    await expect(page.getByText(`${staffEmail} adresine davet gönderildi`)).toBeVisible();
    const staffRow = page.getByRole("row").filter({ hasText: staffEmail });
    await expect(staffRow.getByText(/Davet bekliyor/)).toBeVisible();

    // Rolde kullanıcı varken rol silinemez.
    await page.goto(`${ADMIN_URL}/admin/roller`);
    page.once("dialog", (dialog) => dialog.accept());
    await roleRow.getByRole("button", { name: `${roleName} rolünü sil` }).click();
    await expect(page.getByText("Bu rolde 1 kullanıcı var.", { exact: false })).toBeVisible();

    // 3. Çalışan daveti kabul edip şifresini belirler.
    const link = linkIn(await waitForEmail(staffEmail, "davet edildiniz"));
    const staffDevice = await browser.newContext();
    const staff = await staffDevice.newPage();
    await staff.goto(link);
    await expect(staff.getByText(`Hoş geldiniz, ${staffName}`)).toBeVisible();
    await fillNewPassword(staff, staffPassword);
    await staff.getByRole("button", { name: "Hesabımı aç" }).click();
    await expect(staff).toHaveURL(/\/admin\/login\?durum=davet$/);
    await expect(staff.getByText("Hesabınız hazır.")).toBeVisible();

    // Davet bağlantısı ikinci kez kullanılamaz.
    await staff.goto(link);
    await expect(staff.getByText("Davet geçersiz")).toBeVisible();

    await loginAs(staff, staffEmail, staffPassword);

    // 4. Menüde yalnızca yetkili bölümler.
    const nav = staff.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Ürünler" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Talepler" })).toBeVisible();
    for (const hidden of [
      "Kategoriler",
      "Site Metinleri",
      "Eksik Çeviriler",
      "Diller",
      "Kullanıcılar",
      "Roller",
      "İşlem Kaydı",
      "Site Ayarları",
    ]) {
      await expect(nav.getByRole("link", { name: hidden }), `${hidden} gizli olmalı`).toHaveCount(0);
    }
    await expect(staff.getByText("Bu ayarı yalnızca Süper Yönetici değiştirebilir.")).toBeVisible();

    // Adres yazılarak da açılamaz.
    for (const path of [
      "/admin/categories",
      "/admin/kullanicilar",
      "/admin/islem-kaydi",
      "/admin/site-ayarlari",
      "/admin/products/new",
      "/admin/ceviriler",
    ]) {
      await staff.goto(`${ADMIN_URL}${path}`);
      await expect(staff, path).toHaveURL(/\/admin\/yetkisiz$/);
      await expect(staff.getByText("Bu bölüm için yetkiniz yok")).toBeVisible();
    }

    // Ürünler yalnızca görüntülenir; talepler düzenlenebilir.
    await staff.goto(`${ADMIN_URL}/admin/products`);
    await expect(staff.getByText("Bu bölümü yalnızca görüntüleyebilirsiniz")).toBeVisible();
    await expect(staff.getByRole("link", { name: "Yeni Ürün" })).toHaveCount(0);
    await expect(staff.getByRole("button", { name: "Bu ürünü öne çıkar" }).first()).toBeDisabled();
    await staff.goto(`${ADMIN_URL}/admin/inquiries`);
    await expect(staff.getByText("Bu bölümü yalnızca görüntüleyebilirsiniz")).toHaveCount(0);

    // 5. Pasif yapılan çalışanın açık oturumu hemen kapanır.
    await page.goto(`${ADMIN_URL}/admin/kullanicilar`);
    await expect(staffRow.getByText("Aktif", { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await staffRow.getByRole("button", { name: "Pasif yap" }).click();
    await expect(page.getByText("Kullanıcı pasif yapıldı.")).toBeVisible();

    await staff.goto(`${ADMIN_URL}/admin`);
    await expect(staff).toHaveURL(/\/admin\/login\?durum=oturum$/);
    await expectLoginFails(staff, staffEmail, staffPassword);
    await staffDevice.close();

    // 6. İşlem kaydında kimin ne yaptığı görünür.
    await page.goto(`${ADMIN_URL}/admin/islem-kaydi?kisi=${encodeURIComponent(superName)}`);
    await expect(page.getByText(`Rol ekledi: ${roleName}`)).toBeVisible();
    await expect(page.getByText(`Kullanıcı davet etti: ${staffName} <${staffEmail}>`)).toBeVisible();
    await expect(page.getByText(`Kullanıcıyı pasif yaptı: ${staffName}`)).toBeVisible();
    await page.goto(`${ADMIN_URL}/admin/islem-kaydi?kisi=${encodeURIComponent(staffName)}`);
    await expect(page.getByText("Daveti kabul edip hesabını açtı")).toBeVisible();
  });
});
