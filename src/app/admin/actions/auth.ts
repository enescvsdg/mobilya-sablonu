"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn, signOut, TOO_MANY_ATTEMPTS_CODE } from "@/auth";
import { logActivity } from "@/lib/activity";
import { getAdminBaseUrl } from "@/lib/admin-url";
import {
  CODE_RESEND_SECONDS,
  MAX_CODE_ATTEMPTS,
  checkChangeCode,
  consumeToken,
  createChangeCode,
  createLinkToken,
  findLinkToken,
  findOpenChangeCode,
  recentResetCount,
} from "@/lib/auth-tokens";
import { getCurrentAdmin } from "@/lib/dal";
import { passwordChangeCodeEmail, passwordChangedEmail, passwordResetEmail } from "@/lib/emails";
import { LOGIN_LOCKOUT_MINUTES, clearFailedLogins } from "@/lib/login-throttle";
import { isEmailConfigured, sendEmail } from "@/lib/mailer";
import { MIN_PASSWORD_LENGTH, maskEmail } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error instanceof CredentialsSignin && error.code === TOO_MANY_ATTEMPTS_CODE) {
        return {
          error: `Çok fazla hatalı deneme yapıldı. Güvenlik için giriş ${LOGIN_LOCKOUT_MINUTES} dakika kilitlendi; sonra tekrar deneyin.`,
        };
      }
      return { error: "E-posta veya şifre hatalı." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

/** Yeni şifre kuralları; hata varsa açıklamasını döndürür. */
function checkNewPassword(newPassword: string, confirmPassword: string) {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  if (newPassword.length > 200) return "Yeni şifre çok uzun.";
  if (newPassword !== confirmPassword) return "Yeni şifre ve tekrarı aynı değil.";
  return null;
}

/**
 * Şifreyi değiştirir ve tüm oturumları (bu cihazdakiler dahil) kapatır;
 * kullanıcıya bilgi e-postası gider.
 */
async function applyNewPassword(userId: string, passwordHash: string) {
  const admin = await prisma.adminUser.update({
    where: { id: userId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  await clearFailedLogins(admin.email, null);
  await sendEmail(passwordChangedEmail(admin.email, admin.name));
  return admin;
}

// ── Şifremi unuttum ─────────────────────────────────────────

export type ResetRequestState = { error?: string; sent?: boolean } | undefined;

/** Sıfırlama bağlantısı sayısı; 15 dakikada bir kullanıcıya en fazla bu kadar gider. */
const MAX_RESETS_PER_WINDOW = 3;

export async function requestPasswordResetAction(
  _prevState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  if (!isEmailConfigured()) {
    return {
      error:
        "E-posta gönderimi henüz ayarlanmadığı için şifre sıfırlanamıyor. Süper Yöneticiye başvurun.",
    };
  }

  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { error: "Geçerli bir e-posta adresi girin." };

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.toLowerCase() } });

  // Adresin kayıtlı olup olmadığı yanıttan anlaşılmasın diye her durumda
  // aynı mesaj gösterilir; bağlantı yanıttan sonra gönderilir ki yanıt
  // süresi de bir ipucu vermesin.
  if (admin?.isActive && admin.activatedAt) {
    const baseUrl = await getAdminBaseUrl();
    after(async () => {
      if ((await recentResetCount(admin.id)) >= MAX_RESETS_PER_WINDOW) return;
      const token = await createLinkToken(admin.id, "PASSWORD_RESET");
      const url = `${baseUrl}/admin/sifre-sifirla?t=${token}`;
      await sendEmail(passwordResetEmail(admin.email, admin.name, url));
    });
  }

  return { sent: true };
}

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = await findLinkToken("PASSWORD_RESET", String(formData.get("token") ?? ""));
  if (!token || !token.user.isActive || !token.user.activatedAt) {
    return { error: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bağlantı isteyin." };
  }

  const problem = checkNewPassword(
    String(formData.get("newPassword") ?? ""),
    String(formData.get("confirmPassword") ?? "")
  );
  if (problem) return { error: problem };

  if (!(await consumeToken(token.id))) {
    return { error: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bağlantı isteyin." };
  }

  const admin = await applyNewPassword(
    token.userId,
    await bcrypt.hash(String(formData.get("newPassword")), 12)
  );
  await logActivity("auth.password_reset", "Şifresini e-postadaki bağlantıyla sıfırladı", admin);

  redirect("/admin/login?durum=sifre");
}

// ── Hesabım: şifre değiştirme ───────────────────────────────

export type ChangePasswordState =
  | { error?: string; step?: "code"; sentTo?: string; resentAt?: number }
  | undefined;

/**
 * 1. adım: mevcut şifre doğrulanır, yeni şifre kurallara uyuyorsa e-postaya
 * 6 haneli kod gönderilir. Yeni şifre kod onaylanınca geçerli olur.
 * E-posta gönderimi ayarlanmamışsa şifre mevcut şifreyle hemen değişir.
 */
async function startPasswordChange(formData: FormData): Promise<ChangePasswordState> {
  const current = await getCurrentAdmin();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const problem = checkNewPassword(newPassword, String(formData.get("confirmPassword") ?? ""));
  if (problem) return { error: problem };
  if (newPassword === currentPassword) return { error: "Yeni şifre eskisiyle aynı olamaz." };

  const admin = await prisma.adminUser.findUnique({ where: { id: current.id } });
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return { error: "Mevcut şifre hatalı." };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  if (!isEmailConfigured()) {
    await applyNewPassword(admin.id, newPasswordHash);
    await logActivity("auth.password_change", "Şifresini değiştirdi", admin);
    await signOut({ redirectTo: "/admin/login?durum=sifre" });
  }

  const code = await createChangeCode(admin.id, newPasswordHash);
  if (!(await sendEmail(passwordChangeCodeEmail(admin.email, admin.name, code)))) {
    return { error: "Onay kodu e-postası gönderilemedi. Biraz sonra tekrar deneyin." };
  }
  return { step: "code", sentTo: maskEmail(admin.email), resentAt: Date.now() };
}

/** 2. adım: e-postadaki kod doğrulanır ve yeni şifre geçerli olur. */
async function confirmPasswordChange(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const current = await getCurrentAdmin();
  const result = await checkChangeCode(current.id, String(formData.get("code") ?? ""));

  if (!result.ok) {
    const error =
      result.reason === "wrong"
        ? "Kod hatalı. Kodu e-postadan kontrol edip yeniden yazın."
        : result.reason === "locked"
          ? `${MAX_CODE_ATTEMPTS} kez hatalı kod girildi; bu kod iptal edildi. Şifre değişikliğini baştan başlatın.`
          : "Kodun süresi doldu. Şifre değişikliğini baştan başlatın.";
    return { ...prevState, step: result.reason === "wrong" ? "code" : undefined, error };
  }

  if (!(await consumeToken(result.tokenId))) {
    return { error: "Kodun süresi doldu. Şifre değişikliğini baştan başlatın." };
  }

  const admin = await applyNewPassword(current.id, result.newPasswordHash);
  await logActivity("auth.password_change", "Şifresini değiştirdi (e-posta koduyla)", admin);
  await signOut({ redirectTo: "/admin/login?durum=sifre" });
  return undefined;
}

/** Aynı yeni şifre için yeni kod gönderir (60 saniyede bir). */
async function resendPasswordCode(prevState: ChangePasswordState): Promise<ChangePasswordState> {
  const current = await getCurrentAdmin();
  const open = await findOpenChangeCode(current.id);
  if (!open?.newPasswordHash) {
    return { error: "Kodun süresi doldu. Şifre değişikliğini baştan başlatın." };
  }
  if (Date.now() - open.createdAt.getTime() < CODE_RESEND_SECONDS * 1000) {
    return { ...prevState, step: "code", error: "Yeni kod için biraz bekleyin." };
  }

  const code = await createChangeCode(current.id, open.newPasswordHash);
  if (!(await sendEmail(passwordChangeCodeEmail(current.email, current.name, code)))) {
    return { ...prevState, step: "code", error: "Kod e-postası gönderilemedi. Biraz sonra tekrar deneyin." };
  }
  return { step: "code", sentTo: maskEmail(current.email), resentAt: Date.now() };
}

/**
 * Hesabım'daki şifre değiştirme formunun tek sunucu işlemi; düğmenin
 * `intent` değerine göre adımı seçer.
 */
export async function passwordChangeAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  switch (formData.get("intent")) {
    case "confirm":
      return confirmPasswordChange(prevState, formData);
    case "resend":
      return resendPasswordCode(prevState);
    case "cancel":
      return undefined;
    default:
      return startPasswordChange(formData);
  }
}
