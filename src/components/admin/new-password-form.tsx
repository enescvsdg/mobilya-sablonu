"use client";

import { useActionState } from "react";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

type State = { error?: string } | undefined;

/** Yeni şifre belirleme (şifre sıfırlama ve davet kabulü). */
export function NewPasswordForm({
  token,
  action: serverAction,
  submitLabel,
}: {
  token: string;
  action: (state: State, formData: FormData) => Promise<State>;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(serverAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Yeni şifre</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          autoFocus
          required
        />
        <p className="text-xs text-muted-foreground">En az {MIN_PASSWORD_LENGTH} karakter.</p>
      </div>
      <div className="flex flex-col gap-2">
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
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : submitLabel}
      </Button>
    </form>
  );
}
