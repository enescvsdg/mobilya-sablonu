"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";
import { requireSuperAdmin } from "@/lib/dal";
import { LEVELS, LEVEL_LABELS, SECTIONS, SECTION_LABELS, type Level } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type RoleFormState = { error?: string } | undefined;

function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

export async function saveRoleAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Rol adı 2–40 karakter olmalı." };

  const permissions: Record<string, Level> = {};
  for (const section of SECTIONS) {
    const value = formData.get(`perm_${section}`);
    permissions[section] = isLevel(value) ? value : "none";
  }

  try {
    if (id) {
      await prisma.staffRole.update({ where: { id }, data: { name, permissions } });
    } else {
      await prisma.staffRole.create({ data: { name, permissions } });
    }
  } catch {
    return { error: "Kaydedilemedi — bu adla başka bir rol olabilir." };
  }

  const summary = SECTIONS.map(
    (section) => `${SECTION_LABELS[section]}: ${LEVEL_LABELS[permissions[section]]}`
  ).join(", ");
  await logActivity(id ? "role.update" : "role.create", `${id ? "Rolü güncelledi" : "Rol ekledi"}: ${name} (${summary})`);

  revalidatePath("/admin/roller");
  revalidatePath("/admin/kullanicilar");
  redirect("/admin/roller");
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const role = await prisma.staffRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return { error: "Rol bulunamadı — sayfayı yenileyin." };
  if (role._count.users > 0) {
    return {
      error: `Bu rolde ${role._count.users} kullanıcı var. Önce onların rolünü değiştirin.`,
    };
  }

  await prisma.staffRole.delete({ where: { id } });
  await logActivity("role.delete", `Rolü sildi: ${role.name}`);
  revalidatePath("/admin/roller");
}
