import { chromium } from "@playwright/test";
const S = process.argv[2];
const SITE = "http://localhost:3200";
const A = "http://admin.localhost:3200";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const desk = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: "reduce" });
const page = await desk.newPage();
// Yakında (ziyaretçi)
await page.goto(`${SITE}/tr`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/01-yakinda.png` });
// Giriş + önizleme
await page.goto(`${A}/admin/login`);
await page.getByLabel("E-posta").fill("admin@example.com");
await page.getByLabel("Şifre", { exact: true }).fill("SablonAdmin2026!");
await page.getByRole("button", { name: /Giriş/ }).click();
await page.waitForURL(`${A}/admin`);
await page.screenshot({ path: `${S}/02-panel.png` });
await page.goto(`${A}/admin/onizleme?hedef=${encodeURIComponent("/tr")}`);
await page.waitForURL(/\/tr$/);
await page.waitForTimeout(1000);
for (let y = 0; y < 6000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/03-ana-sayfa.png`, fullPage: true });
for (const [name, path] of [["04-koleksiyonlar", "/tr/koleksiyonlar"], ["05-urun", "/tr/urun/milano-koltuk"], ["06-hakkimizda", "/tr/hakkimizda"], ["07-iletisim", "/tr/iletisim"], ["08-gizlilik", "/tr/gizlilik-politikasi"], ["09-ar-ana", "/ar"]]) {
  await page.goto(`${SITE}${path}`);
  await page.waitForTimeout(1000);
  for (let y = 0; y < 6000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${S}/${name}.png`, fullPage: true });
}
await browser.close();
console.log("ok");
