import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

import { routing } from "@/i18n/routing";

/**
 * Proxy'nin her sayfa isteğinde baktığı iki ayar: "Yakında" modu ve
 * yayındaki (ziyaretçiye açık) diller.
 *
 * Ayarlar her seferinde veritabanından okunmaz, kısa bir süre bellekte
 * tutulur. Panelden yapılan değişiklik bu yüzden birkaç saniye içinde
 * yansır. Prisma istemcisi yerine tek bağlantılık küçük bir havuz
 * kullanılır: proxy ayrı paketlenir ve tek bir satır okur.
 */

export type SiteGate = {
  comingSoon: boolean;
  /** Yayındaki diller, `routing.locales` sırasıyla; varsayılan dil hep dahil. */
  liveLocales: string[];
};

const CACHE_MS = Number(process.env.COMING_SOON_CACHE_MS ?? 10_000);

/**
 * Hiç okunamadıysa: mağaza kapalı (Yakında sayfası veritabanı gerektirmez
 * ve hata sayfasından iyidir), yalnızca varsayılan dil açık.
 */
const FALLBACK: SiteGate = { comingSoon: true, liveLocales: [routing.defaultLocale] };

let pool: Pool | undefined;
let cached: { value: SiteGate; at: number } | undefined;
let pending: Promise<SiteGate> | undefined;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      // Supabase oturum havuzundaki 15 bağlantıdan birini boşuna tutmasın
      // (bkz. src/lib/prisma.ts).
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 3_000,
      query_timeout: 3_000,
    });
    // Boştaki bağlantı koparsa havuz hata olayı yayar; dinlenmezse süreç çöker.
    pool.on("error", () => {});
    attachDatabasePool(pool);
  }
  return pool;
}

async function readGate() {
  try {
    const { rows } = await getPool().query<{ comingSoon: boolean | null; live: string[] }>(
      `SELECT (SELECT "comingSoon" FROM "site_settings" WHERE "id" = 1) AS "comingSoon",
              ARRAY(SELECT "code" FROM "languages" WHERE "isActive") AS "live"`
    );
    const live = rows[0]?.live ?? [];
    const value: SiteGate = {
      comingSoon: rows[0]?.comingSoon ?? true,
      liveLocales: routing.locales.filter(
        (locale) => locale === routing.defaultLocale || live.includes(locale)
      ),
    };
    cached = { value, at: Date.now() };
    return value;
  } catch (error) {
    console.error("[proxy] Site ayarları okunamadı:", error);
    // Veritabanına ulaşılamazsa bilinen son değer kullanılır.
    return cached?.value ?? FALLBACK;
  } finally {
    pending = undefined;
  }
}

export function getSiteGate(): Promise<SiteGate> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return Promise.resolve(cached.value);
  }
  pending ??= readGate();
  return pending;
}
