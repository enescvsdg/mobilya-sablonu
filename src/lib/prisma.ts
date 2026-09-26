import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase'in "Session pooler" bağlantısında aynı anda en fazla 15 bağlantı
 * açık olabilir. Vercel (Fluid compute) sunucu örneğini istekler arasında
 * dondurduğunda boştaki bağlantılar açık kalır ve sınırı doldurur ("max
 * clients reached in session mode"). Bu yüzden havuz küçüktür, boştaki
 * bağlantı birkaç saniyede kapanır ve `attachDatabasePool` örneğin bu süre
 * dolmadan dondurulmasını önler (yerelde ve derlemede etkisizdir).
 */
function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 5_000,
  });
  // Boştaki bağlantı koparsa havuz hata olayı yayar; dinlenmezse süreç çöker.
  pool.on("error", (error) => console.error("[veritabani] Boştaki bağlantı koptu:", error));
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
