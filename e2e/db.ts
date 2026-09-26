import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { Client } from "pg";

import { slugify } from "../src/lib/slugify";

// Testler yerelde .env'deki veritabanını, CI'da iş akışının verdiğini kullanır.
config({ quiet: true });

async function withClient<T>(run: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/** "Yakında" modunu doğrudan veritabanından açar/kapatır. */
export async function setComingSoon(enabled: boolean) {
  await withClient((client) =>
    client.query('UPDATE "site_settings" SET "comingSoon" = $1, "updatedAt" = now() WHERE "id" = 1', [
      enabled,
    ])
  );
}

/**
 * Testlerin kullandığı WhatsApp hattı. Numara şablonda boş başlar (bağlantı
 * gizli); testler bağlantının göründüğü hâli denetler.
 */
export const TEST_WHATSAPP = "905551234567";

export async function setWhatsappNumber(number: string | null) {
  await withClient((client) =>
    client.query('UPDATE "site_settings" SET "whatsappNumber" = $1, "updatedAt" = now() WHERE "id" = 1', [
      number,
    ])
  );
}

/** Dil paketi (routing.ts): arayüz çevirisi hazır, panelden açılan diller. */
export const PACKAGE_LANGUAGES = ["de", "fr", "fa", "az", "es", "it"] as const;

/** Dil paketini kapalı hâline döndürür (dil-paketi.spec.ts onları açar). */
export async function closePackageLanguages() {
  await withClient((client) =>
    client.query(
      `UPDATE "languages" SET "isActive" = false, "isPreparing" = false, "updatedAt" = now()
       WHERE "code" = ANY($1)`,
      [PACKAGE_LANGUAGES]
    )
  );
}

/** Testlerin oluşturduğu kayıtlar bu önekle başlar; temizlik buna bakar. */
export const TEST_PREFIX = "e2e-";

export function uniqueEmail(label: string) {
  return `${TEST_PREFIX}${label}-${randomUUID().slice(0, 8)}@example.test`;
}

/** Şifresi bilinen, etkin bir panel hesabı açar. */
export async function createAdmin(options: {
  email: string;
  password: string;
  name?: string;
  superAdmin?: boolean;
  staffRoleId?: string;
}) {
  const id = randomUUID();
  const hash = await bcrypt.hash(options.password, 10);
  await withClient((client) =>
    client.query(
      `INSERT INTO "admin_users" ("id", "email", "passwordHash", "name", "role", "staffRoleId", "activatedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        id,
        options.email,
        hash,
        options.name ?? "E2E Kullanıcı",
        options.superAdmin ? "SUPER_ADMIN" : "EDITOR",
        options.staffRoleId ?? null,
      ]
    )
  );
  return id;
}

/** Testlerin açtığı kullanıcıları, rolleri ve onların işlem kayıtlarını siler. */
export async function cleanUpTestAccounts() {
  await withClient(async (client) => {
    await client.query(`DELETE FROM "admin_users" WHERE "email" LIKE $1`, [`${TEST_PREFIX}%`]);
    await client.query(`DELETE FROM "staff_roles" WHERE "name" LIKE 'E2E %'`);
    await client.query(`DELETE FROM "login_attempts" WHERE "email" LIKE $1`, [`${TEST_PREFIX}%`]);
    await client.query(`DELETE FROM "activity_logs" WHERE "userName" LIKE 'E2E %'`);
  });
}

/**
 * Yalnızca Türkçesi yazılmış, yayında olmayan bir ürün açar. Panelden
 * kaydedilmiş gibi diğer dillerin satırlarında Türkçe isim ve adres
 * kopyası durur, açıklama boştur. Ürün kimliğini döndürür.
 */
export async function createUntranslatedProduct(options: {
  name: string;
  description: string;
  /** Türkçe varyant adları. */
  variants?: string[];
  /** Türkçe alt metinli bir görsel (sitedeki hazır bir görsel kullanılır). */
  imageAlt?: string;
}) {
  const id = randomUUID();
  const slug = slugify(options.name);
  await withClient(async (client) => {
    await client.query(
      `INSERT INTO "products" ("id", "categoryId", "sku", "isActive", "updatedAt")
       VALUES ($1, (SELECT "id" FROM "categories" ORDER BY "sortOrder", "createdAt" LIMIT 1), $2, false, now())`,
      [id, `${TEST_PREFIX}ceviri-${id.slice(0, 8)}`]
    );
    const { rows } = await client.query<{ code: string }>(
      `SELECT "code" FROM "languages" WHERE "isActive" ORDER BY "sortOrder"`
    );
    for (const [index, { code }] of rows.entries()) {
      await client.query(
        `INSERT INTO "product_translations" ("id", "productId", "languageCode", "name", "slug", "description")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), id, code, options.name, slug, index === 0 ? options.description : null]
      );
    }
    for (const [index, name] of (options.variants ?? []).entries()) {
      await client.query(
        `INSERT INTO "product_variants" ("id", "productId", "name", "colorHex", "sortOrder")
         VALUES ($1, $2, $3, '#2e3b36', $4)`,
        [randomUUID(), id, name, index]
      );
    }
    if (options.imageAlt) {
      await client.query(
        `INSERT INTO "product_images" ("id", "productId", "url", "altText", "sortOrder", "isPrimary")
         VALUES ($1, $2, '/images/products/nova-koltuk.webp', $3, 0, true)`,
        [randomUUID(), id, options.imageAlt]
      );
    }
  });
  return id;
}

/** Verilen ürünleri siler (testin kendi açtıkları). */
export async function deleteProducts(ids: string[]) {
  if (ids.length === 0) return;
  await withClient((client) => client.query(`DELETE FROM "products" WHERE "id" = ANY($1)`, [ids]));
}

/** Önceki çalıştırmalardan kalan test ürünlerini (SKU'su önekle başlayan) siler. */
export async function deleteTestProducts() {
  await withClient((client) =>
    client.query(`DELETE FROM "products" WHERE "sku" LIKE $1`, [`${TEST_PREFIX}%`])
  );
}

type OutboxEmail = { to: string; subject: string; text: string; html: string; sentAt: string };

/** Sunucunun test kutusuna yazdığı e-postalardan bu adrese gelen en sonuncusu. */
export async function lastEmailTo(to: string, subjectIncludes?: string) {
  const file = process.env.EMAIL_OUTBOX_FILE;
  if (!file) throw new Error("EMAIL_OUTBOX_FILE tanımlı değil (playwright.config.ts).");
  const raw = await readFile(file, "utf8").catch(() => "");
  const emails = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OutboxEmail)
    .filter((email) => email.to === to && (!subjectIncludes || email.subject.includes(subjectIncludes)));
  return emails.at(-1) ?? null;
}

/** E-postanın düz metnindeki ilk panel bağlantısı. */
export function linkIn(email: OutboxEmail) {
  const match = email.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error("E-postada bağlantı yok.");
  return match[0];
}

/** Şifre değişikliği e-postasındaki 6 haneli kod. */
export function codeIn(email: OutboxEmail) {
  const match = email.text.match(/\b(\d{6})\b/);
  if (!match) throw new Error("E-postada kod yok.");
  return match[1];
}
