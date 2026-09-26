"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateInquiryStatusAction } from "@/app/admin/actions/inquiries";
import type { InquiryStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  CLOSED: "Kapatıldı",
};

export function InquiryStatusSelect({
  id,
  status,
  requesterName,
}: {
  id: string;
  status: InquiryStatus;
  requesterName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      aria-label={`${requesterName} — durum`}
      onChange={(event) => {
        const next = event.target.value as InquiryStatus;
        startTransition(async () => {
          try {
            await updateInquiryStatusAction(id, next);
            toast.success("Durum güncellendi.");
          } catch {
            toast.error("Durum güncellenemedi.");
          }
        });
      }}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((value) => (
        <option key={value} value={value}>
          {STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
