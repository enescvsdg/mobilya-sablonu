"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireEdit } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import type { InquiryStatus } from "@/generated/prisma/enums";

const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  CLOSED: "Kapatıldı",
};

export async function updateInquiryStatusAction(id: string, status: InquiryStatus) {
  await requireEdit("inquiries");

  const inquiry = await prisma.inquiry.update({ where: { id }, data: { status } });
  await logActivity(
    "inquiry.status",
    `Talebin durumunu değiştirdi: ${inquiry.name} → ${INQUIRY_STATUS_LABELS[status] ?? status}`
  );

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

export async function deleteInquiryAction(id: string) {
  await requireEdit("inquiries");

  const inquiry = await prisma.inquiry.delete({ where: { id } });
  await logActivity("inquiry.delete", `Talebi sildi: ${inquiry.name}`);

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}
