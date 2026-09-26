import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // next.config.ts bodySizeLimit ile aynı
const SUPABASE_BUCKET = "product-images";

const WRONG_KEY_MESSAGE =
  "Görsel yüklenemedi: Supabase anahtarı yetkisiz. Vercel'deki SUPABASE_SERVICE_ROLE_KEY " +
  "değerine Supabase → Project Settings → API Keys → Secret keys bölümündeki sb_secret_ " +
  "ile başlayan anahtarı girip siteyi yeniden yayınlayın.";

/**
 * Sık yapılan hata: gizli anahtar yerine herkese açık anahtarın girilmesi.
 * Supabase bu durumda yalnızca anlaşılmaz bir "row-level security" hatası
 * döndürür; anahtar türüne bakıp baştan açık bir mesaj verilir.
 */
function isPublicKey(key: string) {
  if (key.startsWith("sb_publishable_")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).role === "anon";
  } catch {
    return false;
  }
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  if (isPublicKey(serviceRoleKey)) throw new Error(WRONG_KEY_MESSAGE);
  return createClient(url, serviceRoleKey);
}

function describeStorageError(message: string) {
  if (/row-level security|unauthorized|invalid (jwt|api key)/i.test(message)) {
    return WRONG_KEY_MESSAGE;
  }
  if (/bucket not found/i.test(message)) {
    return "Görsel yüklenemedi: Supabase'te product-images klasörü yok. Siteyi Vercel'den yeniden yayınlayın; klasör otomatik açılır.";
  }
  return `Görsel yüklenemedi: ${message}`;
}

// Vercel'in sunucusuz ortamında dosya sistemi kalıcı değildir — bu yüzden
// SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY tanımlıysa Supabase Storage'a
// yüklenir (production), tanımlı değilse local dosya sistemine yazılır
// (local geliştirme, docker-compose Postgres ile aynı mantık).
export async function saveUploadedImage(
  file: File,
  subfolder: string
): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Sadece JPEG, PNG veya WebP görsel yükleyebilirsin.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Görsel 4 MB'tan büyük olamaz.");
  }

  const filename = `${randomUUID()}.${extension}`;
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const objectPath = `${subfolder}/${filename}`;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, file, { contentType: file.type, upsert: false });

    if (error) {
      throw new Error(describeStorageError(error.message));
    }

    return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
  }

  // Vercel'de dosya sistemi salt okunur; depolama ayarı eksikse yerel
  // klasöre yazmayı denemek anlaşılmaz bir hataya düşerdi.
  if (process.env.VERCEL) {
    throw new Error(
      "Görsel depolama ayarlanmamış (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}
