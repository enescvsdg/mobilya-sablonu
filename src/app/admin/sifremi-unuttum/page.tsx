import { AuthCard } from "@/components/admin/auth-card";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export const metadata = { title: "Şifremi unuttum" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifremi unuttum"
      description="Panel e-posta adresinizi yazın; şifrenizi yenilemeniz için bir bağlantı gönderelim."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
