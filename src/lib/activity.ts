import "server-only";
import { unstable_rethrow } from "next/navigation";

import { getCurrentAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

/** İşlem kaydı bu kadar gün saklanır. */
export const ACTIVITY_RETENTION_DAYS = 365;

/**
 * Panelde yapılan bir işlemi kaydeder: kim, ne zaman, ne yaptı.
 * Kayıt yazılamazsa işlem yine tamamlanır; kayıt asıl işi engellememeli.
 * `actor` verilmezse oturumdaki kullanıcı yazılır (giriş, şifre sıfırlama
 * gibi oturumsuz anlarda verilmelidir).
 */
export async function logActivity(
  action: string,
  summary: string,
  actor?: { id: string; name: string }
) {
  try {
    const who = actor ?? (await getCurrentAdmin());
    await prisma.activityLog.create({
      data: { userId: who.id, userName: who.name, action, summary },
    });
  } catch (error) {
    // Oturum geçersizse getCurrentAdmin çıkışa yönlendirir; o yönlendirme
    // kaydın değil asıl işlemin akışıdır, yutulmaz.
    unstable_rethrow(error);
    console.error("[islem-kaydi] Yazılamadı:", error);
  }
}

/** Saklama süresi dolan kayıtları siler; işlem kaydı ekranı açılınca çağrılır. */
export async function pruneActivity() {
  await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - ACTIVITY_RETENTION_DAYS * 86_400_000) } },
  });
}
