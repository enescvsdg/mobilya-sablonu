import { acceptInviteAction } from "@/app/admin/actions/users";
import { AuthCard } from "@/components/admin/auth-card";
import { NewPasswordForm } from "@/components/admin/new-password-form";
import { findLinkToken } from "@/lib/auth-tokens";
import { brand } from "@/config/brand";

export const metadata = { title: "Davet" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = await findLinkToken("INVITE", t);

  if (!t || !token || !token.user.isActive || token.user.activatedAt) {
    return (
      <AuthCard title="Davet geçersiz">
        <p className="text-sm">
          Bu davetin süresi dolmuş ya da daha önce kullanılmış. Davetler 24 saat
          geçerlidir; yöneticinizden daveti yeniden göndermesini isteyin.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={`Hoş geldiniz, ${token.user.name}`}
      description={`${brand.name} yönetim paneli hesabınızı (${token.user.email}) açmak için bir şifre belirleyin.`}
    >
      <NewPasswordForm token={t} action={acceptInviteAction} submitLabel="Hesabımı aç" />
    </AuthCard>
  );
}
