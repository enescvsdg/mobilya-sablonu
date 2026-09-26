import { expect, test, type Locator } from "@playwright/test";

import { brand } from "../src/config/brand";
import { INTRO_SESSION_KEY } from "../src/lib/intro-session";

/** Öğenin kendisiyle birlikte tüm üst öğelerinin opaklıklarının çarpımı. */
function effectiveOpacity(locator: Locator) {
  return locator.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });
}

test.describe("Giriş animasyonu", () => {
  test.skip(!brand.features.introAnimation, "Marka ayarında kapalı (features.introAnimation).");

  test("ilk ziyarette oynar, logo ve başlık iniş bitince açılır, tekrar oynamaz", async ({
    page,
  }) => {
    await page.goto("/tr");
    const overlay = page.locator(".intro-overlay");
    const navLogo = page.locator('[data-logo-part="primary"]');
    const headline = page.locator("h1");

    await expect(overlay).toBeVisible();
    // Uçan harfler inene kadar navbar logosu ve başlık gizli.
    await expect(navLogo).toHaveCSS("opacity", "0");
    expect(await effectiveOpacity(headline)).toBeLessThan(0.01);

    await expect(overlay).toBeHidden({ timeout: 6000 });
    await expect(navLogo).toHaveCSS("opacity", "1");
    await expect.poll(() => effectiveOpacity(headline), { timeout: 3000 }).toBeGreaterThan(0.99);

    // Aynı oturumda ana sayfa tekrar açılınca animasyon oynamaz.
    await page.reload();
    await expect(overlay).toBeHidden();
    await expect(navLogo).toHaveCSS("opacity", "1");
  });

  test("ziyaretçi bir tuşa basınca animasyon hemen biter", async ({ page }) => {
    await page.goto("/tr");
    // Animasyon betiği çalışmaya başladığında oturuma işaret koyar.
    await page.waitForFunction((key) => sessionStorage.getItem(key) === "1", INTRO_SESSION_KEY);

    await page.keyboard.press("Shift");
    await expect(page.locator(".intro-overlay")).toBeHidden({ timeout: 500 });
    await expect(page.locator('[data-logo-part="primary"]')).toHaveCSS("opacity", "1");
  });
});
