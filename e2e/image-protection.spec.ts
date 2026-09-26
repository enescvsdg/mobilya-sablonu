import { expect, test } from "@playwright/test";

/** Sitedeki görseller kolayca kaydedilemez (src/components/site/image-guard.tsx). */
test("görselde sağ tık ve sürükleme kapalı, metinde sağ tık açık", async ({ page }) => {
  await page.goto("/tr/urun/nova-koltuk");
  const image = page.locator("main img").first();
  await expect(image).toBeVisible();

  const prevented = (selector: string, type: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element, eventType) => {
        const event = new MouseEvent(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      }, type);

  expect(await prevented("main img", "contextmenu")).toBe(true);
  expect(await prevented("main img", "dragstart")).toBe(true);
  expect(await prevented("main h1", "contextmenu")).toBe(false);

  await expect(image).toHaveCSS("user-select", "none");
});

test("görseller en fazla 1920 px dağıtılır", async ({ request }) => {
  const source = encodeURIComponent("/images/products/nova-koltuk.webp");
  const small = await request.get(`/_next/image?url=${source}&w=1920&q=75`);
  expect(small.status()).toBe(200);
  const large = await request.get(`/_next/image?url=${source}&w=3840&q=75`);
  expect(large.status()).toBe(400);
});
