import { expect, type Page } from "@playwright/test";

const PORT = process.env.E2E_PORT ?? "3100";

/**
 * Panel yalnızca admin alt alan adından servis edilir. Tarayıcılar
 * `*.localhost` adreslerini geri döngüye çözdüğü için yerelde ek bir
 * ayar gerekmez.
 */
export const ADMIN_URL = process.env.E2E_ADMIN_URL ?? `http://admin.localhost:${PORT}`;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "SablonAdmin2026!";

export async function login(page: Page) {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

/** Verilen hesapla panele girer ve ana ekranın açıldığını doğrular. */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.getByLabel("E-posta").fill(email);
  // "Şifreyi göster" düğmesi de "Şifre" içerdiği için tam eşleşme.
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Giriş/ }).click();
  await expect(page).toHaveURL(`${ADMIN_URL}/admin`);
}
