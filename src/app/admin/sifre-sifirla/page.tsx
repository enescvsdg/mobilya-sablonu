import Link from "next/link";

import { resetPasswordAction } from "@/app/admin/actions/auth";
import { AuthCard } from "@/components/admin/auth-card";
import { NewPasswordForm } from "@/components/admin/new-password-form";
import { findLinkToken } from "@/lib/auth-tokens";

export const metadata = { title: "Yeni şifre" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = await findLinkToken("PASSWORD_RESET", t);

  if (!t || !token || !token.user.isActive || !token.user.activatedAt) {
    return (
      <AuthCard title="Bağlantı geçersiz">
        <div className="flex flex-col gap-4 text-sm">
          <p>
            Bu şifre sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış.
            Bağlantılar 5 dakika geçerlidir.
          </p>
          <Link href="/admin/sifremi-unuttum" className="underline underline-offset-2">
            Yeni bağlantı iste
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Yeni şifre belirleyin"
      description={`${token.user.email} hesabı için yeni şifrenizi yazın.`}
    >
      <NewPasswordForm token={t} action={resetPasswordAction} submitLabel="Şifremi kaydet" />
    </AuthCard>
  );
}
