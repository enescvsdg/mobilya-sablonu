import { expect, test } from "@playwright/test";

import { ADMIN_URL, login } from "./helpers";

test.describe("Erişilebilirlik", () => {
  test("içeriğe geç bağlantısı klavyeyle ilk ulaşılan öğedir ve hedefine gider", async ({
    page,
  }) => {
    await page.goto("/tr");
    const skipLink = page.getByRole("link", { name: "İçeriğe geç" });
    await expect(skipLink).toHaveAttribute("href", "#main-content");
    await expect(page.locator("#main-content")).toHaveCount(1);

    // Sayfaya girince ilk Tab, menüyü baştan taramadan bu bağlantıya
    // ulaşmalı — skip link'in asıl amacı budur.
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });

  test("mobil menü: Escape ile kapanır ve odak tetikleyiciye döner", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tr");

    const trigger = page.getByRole("button", { name: "Menüyü aç" });
    await trigger.click();

    const panel = page.getByRole("dialog", { name: "Menü" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mobil menü: Tab döngüsü panel dışına çıkmaz", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tr");

    await page.getByRole("button", { name: "Menüyü aç" }).click();
    const panel = page.getByRole("dialog", { name: "Menü" });
    await expect(panel).toBeVisible();

    // İlk odaklanabilir öğe (ilk menü bağlantısı) zaten odaklı olmalı.
    const firstLink = panel.getByRole("link").first();
    await expect(firstLink).toBeFocused();

    // Shift+Tab ile geriye sarınca son odaklanabilir öğeye (dil düğmesi) gitmeli.
    await page.keyboard.press("Shift+Tab");
    const languageButton = panel.getByRole("button", { name: "Dil" });
    await expect(languageButton).toBeFocused();
  });

  test("admin sil düğmelerinin erişilebilir adı var", async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN_URL}/admin/languages`);

    // "Diller" tablosundaki sil düğmeleri artık isimsiz "button" değil,
    // her biri hangi dili sileceğini söyleyen bir isim taşımalı.
    const deleteButtons = page.getByRole("button", { name: /dilini sil$/ });
    await expect(deleteButtons.first()).toBeVisible();
  });
});
