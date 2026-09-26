import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Panel girişinde şifre tahmin saldırılarına karşı sınır.
 *
 * Panel adresi gizli tutulsa da SSL sertifikası kayıtlarında herkese
 * görünür; sınır olmadan saniyede onlarca şifre denenebilir. Sayaç
 * veritabanında tutulur: Vercel'de her istek ayrı bir sunucu örneğine
 * düşebildiği için bellekte tutulan bir sayaç işe yaramaz.
 */
const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
/** Aynı bağlantıdan farklı e-postalar denenmesine karşı. */
const MAX_FAILURES_PER_IP = 20;
const KEEP_HOURS = 24;

export const LOGIN_LOCKOUT_MINUTES = WINDOW_MINUTES;

export async function isLoginBlocked(email: string, ipHash: string | null) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, createdAt: { gte: since } } }),
    ipHash ? prisma.loginAttempt.count({ where: { ipHash, createdAt: { gte: since } } }) : 0,
  ]);
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordFailedLogin(email: string, ipHash: string | null) {
  await prisma.loginAttempt.create({ data: { email, ipHash } });
  // Tablo büyümesin: bir günden eski denemeler silinir.
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - KEEP_HOURS * 3_600_000) } },
  });
}

/** Başarılı girişte o hesabın ve o bağlantının sayacı sıfırlanır. */
export async function clearFailedLogins(email: string, ipHash: string | null) {
  await prisma.loginAttempt.deleteMany({
    where: { OR: [{ email }, ...(ipHash ? [{ ipHash }] : [])] },
  });
}
