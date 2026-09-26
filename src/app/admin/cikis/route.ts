import { signOut } from "@/auth";

/**
 * Oturum artık geçerli değilse (hesap pasif yapıldı, silindi ya da şifre
 * değişti) kullanıcı buraya yönlenir: çerez silinir, giriş ekranı açıklamayla
 * açılır. Bkz. getCurrentAdmin (src/lib/dal.ts).
 */
export async function GET() {
  await signOut({ redirectTo: "/admin/login?durum=oturum" });
}
