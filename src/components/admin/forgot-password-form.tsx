"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordResetAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p role="status">
          Bu e-posta adresi kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen
          kutunuzu (ve istenmeyen/spam klasörünü) kontrol edin.
        </p>
        <p className="text-muted-foreground">
          Bağlantı <strong className="text-foreground">5 dakika</strong> geçerlidir ve
          yalnızca bir kez kullanılabilir.
        </p>
        <Link href="/admin/login" className="text-sm underline underline-offset-2">
          Giriş ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
      </Button>
      <Link
        href="/admin/login"
        className="text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Giriş ekranına dön
      </Link>
    </form>
  );
}
