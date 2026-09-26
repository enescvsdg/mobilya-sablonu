import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/login-form";
import { brand } from "@/config/brand";

/** Giriş ekranına başka akışlardan dönülünce gösterilen açıklamalar. */
const NOTICES: Record<string, string> = {
  oturum: "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.",
  sifre: "Şifreniz değişti. Yeni şifrenizle giriş yapın.",
  davet: "Hesabınız hazır. Belirlediğiniz şifreyle giriş yapın.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const { durum } = await searchParams;

  return (
    <AuthCard title={`${brand.name} Admin`} description="Yönetim paneline giriş yapın.">
      <LoginForm notice={durum ? NOTICES[durum] : undefined} />
    </AuthCard>
  );
}
