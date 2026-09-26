import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  FULL_ACCESS,
  allows,
  parsePermissions,
  type Permissions,
  type Section,
} from "@/lib/permissions";

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  /** "Süper Yönetici" ya da çalışan rolünün adı. */
  roleName: string;
  permissions: Permissions;
};

/**
 * Oturumdaki panel kullanıcısını veritabanından okur. İstek başına bir kez
 * çalışır.
 *
 * Oturum çerezi (JWT) tek başına yeterli sayılmaz: hesap pasif yapılmış,
 * silinmiş ya da şifresi değişmiş (sessionVersion artmış) ise kullanıcı
 * hemen çıkışa yönlenir. Yetkiler de her istekte buradan okunur; rol
 * değişikliği bir sonraki tıklamada geçerli olur.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    include: { staffRole: true },
  });

  if (
    !admin ||
    !admin.isActive ||
    !admin.activatedAt ||
    admin.sessionVersion !== (session.user.sessionVersion ?? 0)
  ) {
    redirect("/admin/cikis");
  }

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    isSuperAdmin,
    roleName: isSuperAdmin ? "Süper Yönetici" : (admin.staffRole?.name ?? "Rol atanmamış"),
    permissions: isSuperAdmin ? FULL_ACCESS : parsePermissions(admin.staffRole?.permissions),
  };
});

/** Giriş yapılmış ve hesabı geçerli olmalı; oturum bilgisini döndürür. */
export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await getCurrentAdmin();
  return session;
});

/** Bölümü en az görüntüleme yetkisi olmalı (sayfalar). */
export async function requireView(section: Section) {
  const admin = await getCurrentAdmin();
  if (!allows(admin.permissions, section, "view")) redirect("/admin/yetkisiz");
  return admin;
}

/** Bölümü düzenleme yetkisi olmalı (sunucu işlemleri). */
export async function requireEdit(section: Section) {
  const admin = await getCurrentAdmin();
  if (!allows(admin.permissions, section, "edit")) redirect("/admin/yetkisiz");
  return admin;
}

/** Kullanıcılar, roller, işlem kaydı ve Yakında ayarı. */
export async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin.isSuperAdmin) redirect("/admin/yetkisiz");
  return admin;
}
