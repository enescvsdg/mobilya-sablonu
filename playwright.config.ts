import os from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

// Testlerde e-postalar gönderilmez, bu dosyaya yazılır (src/lib/mailer.ts);
// sunucu da testler de ortam değişkeninden okur.
process.env.EMAIL_OUTBOX_FILE ??= path.join(os.tmpdir(), "site-e2e-outbox.jsonl");
// Otomatik çeviri Google'a gitmez; metnin başına dil kodu eklenir
// (src/lib/translation.ts).
process.env.TRANSLATION_FAKE ??= "1";
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Tarayıcıyı Playwright kendisi indirir. Hazır bir Chromium bulunan
 * ortamlarda (CI imajları, sandbox) PLAYWRIGHT_CHROMIUM_PATH ile o
 * çalıştırılabilir dosya gösterilebilir.
 */
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
  : {};

/**
 * Tarayıcı grupları: "chromium" (masaüstü Chrome ve Android) ile "webkit"
 * (iPhone Safari). CI ikisini ayrı işlerde aynı anda çalıştırır
 * (E2E_BROWSERS); verilmezse ikisi birden çalışır. WebKit kurulu olmayan
 * bir ortamda E2E_BROWSERS=chromium.
 */
const browsers = process.env.E2E_BROWSERS ?? "all";
if (!["all", "chromium", "webkit"].includes(browsers)) {
  throw new Error(`E2E_BROWSERS "all", "chromium" ya da "webkit" olmalı (verilen: ${browsers}).`);
}
const withChromium = browsers !== "webkit";
const withWebKit = browsers !== "chromium";
const iphone = devices["iPhone 15"];
/** Siteyi bütünüyle değiştiren (Yakında modu, yayındaki diller) testler en sonda, sırayla. */
const SITE_WIDE = /(coming-soon|dil-paketi)\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    // Yönetim paneli admin.<alan adı> ile ayrıldığı için testler de bu
    // ana bilgisayar adını kullanır (localhost'ta alt alan adı çalışır).
    ignoreHTTPSErrors: true,
  },

  globalSetup: "./e2e/global-setup.ts",

  projects: [
    ...(withChromium
      ? [
          {
            name: "chromium",
            use: { ...devices["Desktop Chrome"], ...launchOptions },
            testIgnore: SITE_WIDE,
          },
          {
            name: "mobile",
            use: { ...devices["Pixel 7"], ...launchOptions },
            testIgnore: SITE_WIDE,
          },
        ]
      : []),
    // Safari'ye özgü hatalar (yazı tipi, animasyon, form davranışı)
    // Chromium'da görünmez; iPhone ziyaretçilerini WebKit temsil eder.
    ...(withWebKit
      ? [{ name: "iphone", use: iphone, testIgnore: SITE_WIDE }]
      : []),
    // "Yakında" modu sitenin tamamını kapattığı için bu testler diğerleri
    // bittikten sonra, tek başına çalışır.
    ...(withChromium
      ? [
          {
            name: "yakinda",
            // Kök adres tarayıcı diline göre yönlendiği için Türk ziyaretçi gibi.
            use: { ...devices["Desktop Chrome"], locale: "tr-TR", ...launchOptions },
            testMatch: /coming-soon\.spec\.ts/,
            dependencies: ["chromium", "mobile", ...(withWebKit ? ["iphone"] : [])],
          },
        ]
      : []),
    ...(withWebKit
      ? [
          {
            name: "yakinda-iphone",
            use: { ...iphone, locale: "tr-TR" },
            testMatch: /coming-soon\.spec\.ts/,
            dependencies: withChromium ? ["yakinda"] : ["iphone"],
          },
        ]
      : []),
    // Dil paketi: dilleri hazırlığa ve yayına alır; site haritası ve
    // hreflang değiştiği için Yakında testlerinden de sonra çalışır.
    ...(withChromium
      ? [
          {
            name: "dil-paketi",
            use: { ...devices["Desktop Chrome"], locale: "tr-TR", ...launchOptions },
            testMatch: /dil-paketi\.spec\.ts/,
            dependencies: [withWebKit ? "yakinda-iphone" : "yakinda"],
          },
        ]
      : []),
  ],

  webServer: {
    // Üretim derlemesi test edilir: proxy, metadata ve statik üretim
    // yalnızca `next build` sonrasında gerçek davranışını gösterir.
    // Proxy "Yakında" ayarını birkaç saniye önbellekler; testler modu
    // açıp kapattığı için önbellek kapatılır.
    command: `pnpm build && COMING_SOON_CACHE_MS=0 pnpm start --port ${PORT}`,
    url: `${baseURL}/tr`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
