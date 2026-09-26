/**
 * Canlı yayın öncesi veritabanı ve depolama kurulumu.
 *
 * `pnpm build` içinden çağrılır ve yalnızca Vercel'in canlı (production)
 * yayınında iş yapar; önizleme yayınlarında ve yerelde hiçbir şeye
 * dokunmaz. Böylece site sahibi terminal açmadan her yayında:
 *
 *   1. Bekleyen veritabanı değişiklikleri (migration) uygulanır.
 *   2. İlk kurulumsa diller, ilk admin ve demo katalog eklenir
 *      (prisma/seed.ts — dolu tablolara dokunmaz).
 *   3. Görsellerin yükleneceği Supabase klasörü (bucket) yoksa açılır ve
 *      Vercel'e girilen Supabase anahtarının türü kayda yazılır (anahtarın
 *      kendisi değil) — yanlış anahtar girildiyse kayıtta hemen görünür.
 *
 * Veritabanı adımlarından biri başarısız olursa yayın durur; site eski
 * haliyle çalışmaya devam eder.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const BUCKET = "product-images";
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

if (process.env.VERCEL_ENV !== "production") {
  console.log("[kurulum] Canlı yayın değil — veritabanı kurulumu atlandı.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[kurulum] DATABASE_URL tanımlı değil. Vercel > Settings > Environment Variables " +
      "bölümüne Supabase bağlantı adresini ekleyip yeniden yayınlayın."
  );
  process.exit(1);
}

// `pnpm build` dışında (ör. elle `node scripts/...`) çalıştırıldığında da
// projedeki prisma ve tsx komutları bulunsun.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const binDir = path.join(projectRoot, "node_modules", ".bin");
const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}` };

function run(title, args) {
  console.log(`[kurulum] ${title}`);
  execFileSync("prisma", args, { cwd: projectRoot, env, stdio: "inherit" });
}

run("Veritabanı değişiklikleri uygulanıyor...", ["migrate", "deploy"]);
run("İlk kurulum verisi kontrol ediliyor...", ["db", "seed"]);

await setUpStorage();

/** Anahtarın türünü, değerini açık etmeden anlatır. */
function describeKey(key) {
  if (key.startsWith("sb_secret_")) return { ok: true, label: "gizli anahtar (sb_secret_)" };
  if (key.startsWith("sb_publishable_")) {
    return { ok: false, label: "HERKESE AÇIK anahtar (sb_publishable_)" };
  }
  const payload = key.split(".")[1];
  if (payload) {
    try {
      const role = JSON.parse(Buffer.from(payload, "base64url").toString()).role;
      return { ok: role === "service_role", label: `eski tip anahtar (rol: ${role})` };
    } catch {
      // Tanınmayan biçim; aşağıda genel uyarı verilir.
    }
  }
  return { ok: false, label: "tanınmayan biçim" };
}

async function setUpStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "[kurulum] UYARI: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil — " +
        "panelden görsel yüklenemez."
    );
    return;
  }

  const key = describeKey(serviceRoleKey);
  console.log(`[kurulum] SUPABASE_SERVICE_ROLE_KEY türü: ${key.label}`);
  if (!key.ok) {
    console.warn(
      "[kurulum] UYARI: Bu anahtarla panelden görsel yüklenemez. Supabase → Project Settings → " +
        "API Keys → Secret keys bölümündeki sb_secret_ ile başlayan anahtarı girin."
    );
  }

  // Klasör önce doğrudan veritabanından açılır; bu yol anahtara bağlı
  // değildir. Görsel deposu Supabase'e özgü olduğundan tablo yoksa
  // (Supabase dışı bir veritabanı) Storage API'sine geçilir.
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(
      "select to_regclass('storage.buckets') is not null as has_storage"
    );
    if (rows[0]?.has_storage) {
      const { rowCount } = await client.query(
        `insert into storage.buckets (id, name, public, allowed_mime_types)
         values ($1, $1, true, $2)
         on conflict (id) do nothing`,
        [BUCKET, MIME_TYPES]
      );
      console.log(`[kurulum] Görsel klasörü "${BUCKET}" ${rowCount ? "açıldı" : "hazır"}.`);
      return;
    }
  } catch (error) {
    console.warn(`[kurulum] Görsel klasörü veritabanından açılamadı (${error.message}).`);
  } finally {
    await client.end().catch(() => {});
  }

  // Görsel deposu bir kez açılınca kalıcıdır; buradaki bir aksaklık
  // (ör. Supabase'e o an ulaşılamaması) yayını durdurmaz, uyarı bırakır.
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);

  if (bucket) {
    console.log(`[kurulum] Görsel klasörü "${BUCKET}" hazır.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: MIME_TYPES,
  });
  console.log(
    error
      ? `[kurulum] UYARI: Görsel klasörü açılamadı (${error.message}) — Supabase anahtarlarını kontrol edin.`
      : `[kurulum] Görsel klasörü "${BUCKET}" açıldı.`
  );
}
