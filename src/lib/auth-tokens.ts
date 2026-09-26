import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import type { AuthTokenType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * E-postayla gönderilen bağlantılar (şifre sıfırlama, davet) ve şifre
 * değişikliği kodları. Veritabanında yalnızca AUTH_SECRET ile alınmış
 * özetleri durur: veritabanı sızsa bile bağlantılar ve kodlar kullanılamaz.
 * Her kullanıcının her türden yalnızca bir geçerli jetonu olur; yenisi
 * üretilince öncekiler geçersizleşir.
 */

export const TOKEN_TTL_MINUTES: Record<AuthTokenType, number> = {
  PASSWORD_RESET: 5,
  PASSWORD_CHANGE: 5,
  INVITE: 24 * 60,
};

/** Şifre değişikliği kodunda izin verilen hatalı deneme. */
export const MAX_CODE_ATTEMPTS = 5;
/** Aynı kullanıcıya yeni kod göndermeden önce beklenecek süre. */
export const CODE_RESEND_SECONDS = 60;

function digest(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET tanımlı değil.");
  return createHmac("sha256", secret).update(`site-auth:${value}`).digest("hex");
}

function sameDigest(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function expiry(type: AuthTokenType) {
  return new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60_000);
}

async function revokeOpenTokens(userId: string, type: AuthTokenType) {
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
}

/** Şifre sıfırlama ya da davet bağlantısı için yeni anahtar üretir. */
export async function createLinkToken(userId: string, type: "PASSWORD_RESET" | "INVITE") {
  await revokeOpenTokens(userId, type);
  const token = randomBytes(32).toString("base64url");
  await prisma.authToken.create({
    data: { userId, type, tokenHash: digest(`${type}:${token}`), expiresAt: expiry(type) },
  });
  return token;
}

/** Süresi dolmamış, kullanılmamış bağlantıyı (ve sahibini) bulur. */
export async function findLinkToken(type: "PASSWORD_RESET" | "INVITE", token: string | undefined) {
  if (!token || token.length > 128) return null;
  return prisma.authToken.findFirst({
    where: {
      type,
      tokenHash: digest(`${type}:${token}`),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

/**
 * Jetonu kullanılmış işaretler. Aynı bağlantı iki sekmede aynı anda
 * gönderilse bile yalnızca biri true alır.
 */
export async function consumeToken(id: string) {
  const { count } = await prisma.authToken.updateMany({
    where: { id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  return count === 1;
}

/** Son 15 dakikada bu kullanıcıya gönderilen sıfırlama bağlantısı sayısı. */
export async function recentResetCount(userId: string) {
  return prisma.authToken.count({
    where: {
      userId,
      type: "PASSWORD_RESET",
      createdAt: { gt: new Date(Date.now() - 15 * 60_000) },
    },
  });
}

/** Açık bir şifre değişikliği kodu (varsa). */
export async function findOpenChangeCode(userId: string) {
  return prisma.authToken.findFirst({
    where: { userId, type: "PASSWORD_CHANGE", usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Şifre değişikliği için 6 haneli kod üretir. Yeni şifrenin özeti kodla
 * birlikte saklanır; kod doğrulanınca geçerli olur.
 */
export async function createChangeCode(userId: string, newPasswordHash: string) {
  await revokeOpenTokens(userId, "PASSWORD_CHANGE");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.authToken.create({
    data: {
      userId,
      type: "PASSWORD_CHANGE",
      tokenHash: digest(`PASSWORD_CHANGE:${userId}:${code}`),
      newPasswordHash,
      expiresAt: expiry("PASSWORD_CHANGE"),
    },
  });
  return code;
}

export type CodeCheck =
  | { ok: true; newPasswordHash: string; tokenId: string }
  | { ok: false; reason: "missing" | "wrong" | "locked" };

/** Kodu doğrular; hatalı denemeleri sayar, sınır aşılınca kodu yakar. */
export async function checkChangeCode(userId: string, code: string): Promise<CodeCheck> {
  const token = await findOpenChangeCode(userId);
  if (!token?.newPasswordHash) return { ok: false, reason: "missing" };

  const normalized = code.replace(/\s/g, "");
  if (/^\d{6}$/.test(normalized) && sameDigest(token.tokenHash, digest(`PASSWORD_CHANGE:${userId}:${normalized}`))) {
    return { ok: true, newPasswordHash: token.newPasswordHash, tokenId: token.id };
  }

  const attempts = token.attempts + 1;
  await prisma.authToken.update({
    where: { id: token.id },
    data: { attempts, usedAt: attempts >= MAX_CODE_ATTEMPTS ? new Date() : null },
  });
  return { ok: false, reason: attempts >= MAX_CODE_ATTEMPTS ? "locked" : "wrong" };
}
