"use client";

import { useActionState, useEffect, useState } from "react";

import { passwordChangeAction } from "@/app/admin/actions/auth";
import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

const RESEND_SECONDS = 60;

/** "Kodu yeniden gönder" düğmesi için geri sayım. */
function useCountdown(since: number | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [since]);
  if (!since) return 0;
  // Sunucu ile tarayıcının saati biraz farklı olabilir; sayaç 60'ı aşmasın.
  return Math.min(RESEND_SECONDS, Math.max(0, RESEND_SECONDS - Math.floor((now - since) / 1000)));
}

/**
 * Şifre değiştirme. E-posta gönderimi ayarlıysa iki adımlıdır: önce mevcut
 * ve yeni şifre, sonra e-postaya gelen 6 haneli kod. Başarılı olunca tüm
 * oturumlar kapanır ve giriş ekranı açılır.
 */
export function PasswordForm({ emailEnabled }: { emailEnabled: boolean }) {
  const [state, action, pending] = useActionState(passwordChangeAction, undefined);
  const secondsLeft = useCountdown(state?.resentAt);

  if (state?.step === "code") {
    return (
      <form action={action} className="flex max-w-sm flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{state.sentTo}</strong> adresine 6 haneli
          bir onay kodu gönderildi. Kod 5 dakika geçerlidir.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Onay kodu</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{3} ?\d{3}"
            maxLength={7}
            placeholder="123456"
            className="max-w-40 tracking-[0.3em]"
            autoFocus
            required
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="intent" value="confirm" disabled={pending}>
            {pending ? "Kontrol ediliyor..." : "Onayla ve şifreyi değiştir"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="resend"
            variant="outline"
            formNoValidate
            disabled={pending || secondsLeft > 0}
          >
            {secondsLeft > 0 ? `Yeniden gönder (${secondsLeft})` : "Kodu yeniden gönder"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="cancel"
            variant="ghost"
            formNoValidate
            disabled={pending}
          >
            Vazgeç
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Mevcut şifre</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Yeni şifre</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        <p className="text-xs text-muted-foreground">En az {MIN_PASSWORD_LENGTH} karakter.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Yeni şifre (tekrar)</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <p className="text-xs text-muted-foreground">
        {emailEnabled
          ? "Güvenlik için e-postanıza gelecek kodla onaylayacaksınız. Şifre değişince tüm cihazlardaki oturumlar kapanır."
          : "Şifre değişince tüm cihazlardaki oturumlar kapanır. (E-posta gönderimi ayarlanınca değişiklik e-postaya gelen kodla onaylanacak.)"}
      </p>

      <Button type="submit" name="intent" value="start" disabled={pending} className="w-fit">
        {pending
          ? "Gönderiliyor..."
          : emailEnabled
            ? "Onay kodu gönder"
            : "Şifreyi değiştir"}
      </Button>
    </form>
  );
}
