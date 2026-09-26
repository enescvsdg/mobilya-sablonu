"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";
import { getAdminBaseUrl } from "@/lib/admin-url";
import { consumeToken, createLinkToken, findLinkToken } from "@/lib/auth-tokens";
import { requireSuperAdmin } from "@/lib/dal";
import { inviteEmail } from "@/lib/emails";
import { isEmailConfigured, sendEmail } from "@/lib/mailer";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";

/** Formdaki "Yetki" seçiminde Süper Yönetici'nin değeri; diğerleri rol kimliğidir. */
const SUPER_ADMIN_ACCESS = "super";

const EMAIL_NOT_CONFIGURED =
  "E-posta gönderimi henüz ayarlanmadığı için davet gönderilemiyor. Resend kurulumundan sonra tekrar deneyin.";

export type UserFormState = { error?: string; success?: string } | undefined;

async function resolveAccess(value: string) {
  if (value === SUPER_ADMIN_ACCESS) {
    return { role: "SUPER_ADMIN" as const, staffRoleId: null, label: "Süper Yönetici" };
  }
  const staffRole = value ? await prisma.staffRole.findUnique({ where: { id: value } }) : null;
  return staffRole
    ? { role: "EDITOR" as const, staffRoleId: staffRole.id, label: staffRole.name }
    : null;
}

/**
 * Paneli kilitlememek için en az bir etkin Süper Yönetici kalmalı. Verilen
 * kullanıcı dışında kaç tane olduğunu sayar.
 */
async function otherActiveSuperAdmins(userId: string) {
  return prisma.adminUser.count({
    where: {
      id: { not: userId },
      role: "SUPER_ADMIN",
      isActive: true,
      activatedAt: { not: null },
    },
  });
}

function isActiveSuperAdmin(user: { role: string; isActive: boolean; activatedAt: Date | null }) {
  return user.role === "SUPER_ADMIN" && user.isActive && user.activatedAt !== null;
}

async function sendInvite(user: { id: string; name: string; email: string }, inviterName: string) {
  const token = await createLinkToken(user.id, "INVITE");
  const url = `${await getAdminBaseUrl()}/admin/davet?t=${token}`;
  return sendEmail(inviteEmail(user.email, user.name, inviterName, url));
}

function revalidateUsers() {
  revalidatePath("/admin/kullanicilar");
}

export async function inviteUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const me = await requireSuperAdmin();
  if (!isEmailConfigured()) return { error: EMAIL_NOT_CONFIGURED };

  const name = String(formData.get("name") ?? "").trim();
  const parsedEmail = z.email().safeParse(String(formData.get("email") ?? "").trim());
  const access = await resolveAccess(String(formData.get("access") ?? ""));

  if (name.length < 2 || name.length > 80) return { error: "Ad Soyad 2–80 karakter olmalı." };
  if (!parsedEmail.success) return { error: "Geçerli bir e-posta adresi girin." };
  if (!access) return { error: "Bir rol seçin." };

  const email = parsedEmail.data.toLowerCase();
  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return { error: "Bu e-posta adresiyle zaten bir hesap var." };
  }

  // Kişi davetle kendi şifresini belirleyene kadar kimsenin bilmediği,
  // kullanılamaz bir şifre durur; zaten etkin olmayan hesap giriş yapamaz.
  const user = await prisma.adminUser.create({
    data: {
      name,
      email,
      role: access.role,
      staffRoleId: access.staffRoleId,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
    },
  });

  if (!(await sendInvite(user, me.name))) {
    await prisma.adminUser.delete({ where: { id: user.id } });
    return { error: "Davet e-postası gönderilemedi, kullanıcı oluşturulmadı. Biraz sonra tekrar deneyin." };
  }

  await logActivity("user.invite", `Kullanıcı davet etti: ${name} <${email}> — ${access.label}`);
  revalidateUsers();
  return { success: `${email} adresine davet gönderildi. Davet 24 saat geçerli.` };
}

export async function resendInviteAction(userId: string): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  if (!isEmailConfigured()) return { error: EMAIL_NOT_CONFIGURED };

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return { error: "Kullanıcı bulunamadı — sayfayı yenileyin." };
  if (user.activatedAt) return { error: "Bu kullanıcı hesabını zaten açmış." };

  if (!(await sendInvite(user, me.name))) {
    return { error: "Davet e-postası gönderilemedi. Biraz sonra tekrar deneyin." };
  }
  await logActivity("user.invite.resend", `Daveti yeniden gönderdi: ${user.name} <${user.email}>`);
  revalidateUsers();
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const me = await requireSuperAdmin();

  const user = await prisma.adminUser.findUnique({
    where: { id: String(formData.get("id") ?? "") },
    include: { staffRole: true },
  });
  if (!user) return { error: "Kullanıcı bulunamadı." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: "Ad Soyad 2–80 karakter olmalı." };

  const access = await resolveAccess(String(formData.get("access") ?? ""));
  if (!access) return { error: "Bir rol seçin." };

  const accessChanged = access.role !== user.role || access.staffRoleId !== user.staffRoleId;
  if (accessChanged && user.id === me.id) {
    return { error: "Kendi rolünüzü değiştiremezsiniz; başka bir Süper Yönetici değiştirebilir." };
  }
  if (
    accessChanged &&
    access.role !== "SUPER_ADMIN" &&
    isActiveSuperAdmin(user) &&
    (await otherActiveSuperAdmins(user.id)) === 0
  ) {
    return { error: "Son Süper Yönetici'nin rolü değiştirilemez; önce başka birini Süper Yönetici yapın." };
  }

  // E-posta yalnızca davet kabul edilmeden önce düzeltilebilir (yazım hatası).
  let email = user.email;
  const rawEmail = formData.get("email");
  if (!user.activatedAt && typeof rawEmail === "string" && rawEmail.trim()) {
    const parsed = z.email().safeParse(rawEmail.trim());
    if (!parsed.success) return { error: "Geçerli bir e-posta adresi girin." };
    email = parsed.data.toLowerCase();
    if (email !== user.email && (await prisma.adminUser.findUnique({ where: { email } }))) {
      return { error: "Bu e-posta adresiyle zaten bir hesap var." };
    }
  }
  const emailChanged = email !== user.email;
  if (emailChanged && !isEmailConfigured()) return { error: EMAIL_NOT_CONFIGURED };

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: { name, email, role: access.role, staffRoleId: access.staffRoleId },
  });

  if (emailChanged && !(await sendInvite(updated, me.name))) {
    return { error: "E-posta düzeltildi ama davet gönderilemedi. Listeden daveti yeniden gönderin." };
  }

  const changes = [
    name !== user.name ? `ad: ${name}` : null,
    accessChanged ? `rol: ${access.label}` : null,
    emailChanged ? `e-posta: ${email} (davet yeniden gönderildi)` : null,
  ].filter(Boolean);
  await logActivity(
    "user.update",
    `Kullanıcıyı güncelledi: ${user.name}${changes.length ? ` — ${changes.join(", ")}` : ""}`
  );
  revalidateUsers();
  redirect("/admin/kullanicilar");
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  if (typeof active !== "boolean") return { error: "Geçersiz istek." };
  if (userId === me.id) return { error: "Kendi hesabınızı pasif yapamazsınız." };

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return { error: "Kullanıcı bulunamadı — sayfayı yenileyin." };
  if (!active && isActiveSuperAdmin(user) && (await otherActiveSuperAdmins(user.id)) === 0) {
    return { error: "Son Süper Yönetici pasif yapılamaz." };
  }

  // Pasif hesabın açık oturumları bir sonraki tıklamada kapanır
  // (getCurrentAdmin her istekte isActive'e bakar).
  await prisma.adminUser.update({ where: { id: userId }, data: { isActive: active } });
  await logActivity(
    active ? "user.activate" : "user.deactivate",
    `${active ? "Kullanıcıyı yeniden aktif yaptı" : "Kullanıcıyı pasif yaptı"}: ${user.name}`
  );
  revalidateUsers();
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  if (userId === me.id) return { error: "Kendi hesabınızı silemezsiniz." };

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return { error: "Kullanıcı bulunamadı — sayfayı yenileyin." };
  if (isActiveSuperAdmin(user) && (await otherActiveSuperAdmins(user.id)) === 0) {
    return { error: "Son Süper Yönetici silinemez." };
  }

  // İşlem kayıtları silinmez; kişinin adı kayıtta kalır.
  await prisma.adminUser.delete({ where: { id: userId } });
  await logActivity("user.delete", `Kullanıcıyı sildi: ${user.name} <${user.email}>`);
  revalidateUsers();
}

// ── Davet kabulü (oturumsuz) ────────────────────────────────

export type AcceptInviteState = { error?: string } | undefined;

export async function acceptInviteAction(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const expired = "Davetin süresi dolmuş ya da daha önce kullanılmış. Yöneticinizden daveti yeniden göndermesini isteyin.";
  const token = await findLinkToken("INVITE", String(formData.get("token") ?? ""));
  if (!token || !token.user.isActive || token.user.activatedAt) return { error: expired };

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` };
  }
  if (newPassword.length > 200) return { error: "Şifre çok uzun." };
  if (newPassword !== String(formData.get("confirmPassword") ?? "")) {
    return { error: "Şifre ve tekrarı aynı değil." };
  }

  if (!(await consumeToken(token.id))) return { error: expired };

  const user = await prisma.adminUser.update({
    where: { id: token.userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12), activatedAt: new Date() },
  });
  await logActivity("user.invite.accept", "Daveti kabul edip hesabını açtı", user);

  redirect("/admin/login?durum=davet");
}
