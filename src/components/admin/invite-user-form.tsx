"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { inviteUserAction } from "@/app/admin/actions/users";
import { AccessSelect } from "@/components/admin/access-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteUserForm({
  roles,
  emailEnabled,
}: {
  roles: { id: string; name: string }[];
  emailEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(inviteUserAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      toast.success(state.success);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {!emailEnabled && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          E-posta gönderimi (Resend) henüz ayarlanmadı. Davetler, kurulum tamamlanınca
          gönderilebilecek.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-name">Ad Soyad</Label>
          <Input id="invite-name" name="name" required minLength={2} maxLength={80} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">E-posta</Label>
          <Input id="invite-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-access">Rol</Label>
          <AccessSelect id="invite-access" roles={roles} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !emailEnabled}>
          {pending ? "Gönderiliyor..." : "Davet gönder"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Kişiye e-postayla bir bağlantı gider; şifresini kendisi belirler. Davet 24 saat geçerlidir.
        </p>
      </div>
    </form>
  );
}
