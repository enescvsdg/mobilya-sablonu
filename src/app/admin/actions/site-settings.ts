"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { requireSuperAdmin } from "@/lib/dal";
import { setComingSoon, setWhatsappNumber } from "@/lib/site-settings";
import type { ActionResult } from "@/lib/action-result";
import { formatWhatsappNumber, normalizeWhatsappNumber } from "@/lib/whatsapp";

/**
 * "Yakında" modunu açar/kapatır. Mağazayı herkese açan ayar olduğu için
 * yalnızca Süper Yönetici değiştirebilir (rol her istekte veritabanından
 * okunur, bkz. getCurrentAdmin).
 */
export async function setComingSoonAction(enabled: boolean): Promise<ActionResult> {
  await requireSuperAdmin();
  // Sunucu işlemine istemciden her şey gönderilebilir.
  if (typeof enabled !== "boolean") {
    return { error: "Geçersiz istek." };
  }

  await setComingSoon(enabled);
  await logActivity(
    "settings.coming_soon",
    enabled ? "Yakında sayfasını açtı (site ziyaretçilere kapandı)" : "Mağazayı açtı (Yakında sayfası kapandı)"
  );
  revalidatePath("/admin");
}

export type WhatsappFormState = { error?: string; saved?: string } | undefined;

/**
 * İletişim ve Yakında sayfalarındaki WhatsApp numarası. Nasıl yazılırsa
 * yazılsın WhatsApp'ın istediği biçime çevrilir; boş bırakılırsa bağlantı
 * sitede gösterilmez. Yalnızca Süper Yönetici değiştirebilir.
 */
export async function saveWhatsappNumberAction(
  _prevState: WhatsappFormState,
  formData: FormData
): Promise<WhatsappFormState> {
  await requireSuperAdmin();

  const raw = String(formData.get("whatsappNumber") ?? "").trim();
  const digits = raw === "" ? null : normalizeWhatsappNumber(raw);
  if (raw !== "" && !digits) {
    return {
      error:
        "Numara geçersiz. Ör. 0555 123 45 67 ya da ülke koduyla +90 555 123 45 67 biçiminde yazın.",
    };
  }

  await setWhatsappNumber(digits);
  await logActivity(
    "settings.whatsapp",
    digits
      ? `WhatsApp numarasını değiştirdi: ${formatWhatsappNumber(digits)}`
      : "WhatsApp bağlantısını kaldırdı (numara boş)"
  );
  // İletişim sayfası her istekte, Yakında sayfası önceden üretilir.
  revalidatePath("/", "layout");
  revalidatePath("/yakinda/[locale]", "page");
  revalidatePath("/admin/site-ayarlari");
  return { saved: digits ?? "" };
}
