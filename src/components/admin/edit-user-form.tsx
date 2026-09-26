"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updateUserAction } from "@/app/admin/actions/users";
import { AccessSelect } from "@/components/admin/access-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditUserForm({
  user,
  roles,
}: {
  user: { id: string; name: string; email: string; access: string; pending: boolean; isSelf: boolean };
  roles: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(updateUserAction, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="id" value={user.id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-name">Ad Soyad</Label>
        <Input id="user-name" name="name" defaultValue={user.name} required minLength={2} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-email">E-posta</Label>
        <Input
          id="user-email"
          name="email"
          type="email"
          defaultValue={user.email}
          disabled={!user.pending}
          required
        />
        <p className="text-xs text-muted-foreground">
          {user.pending
            ? "Davet henüz kabul edilmedi; yazım hatası varsa düzeltin, davet yeni adrese yeniden gönderilir."
            : "Hesap açıldıktan sonra e-posta değiştirilemez."}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-access">Rol</Label>
        <AccessSelect id="user-access" roles={roles} defaultValue={user.access} disabled={user.isSelf} />
        {user.isSelf && (
          <>
            {/* Seçim kapalıyken form değeri gönderilmez; mevcut rol korunur. */}
            <input type="hidden" name="access" value={user.access} />
            <p className="text-xs text-muted-foreground">Kendi rolünüzü değiştiremezsiniz.</p>
          </>
        )}
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/kullanicilar">Vazgeç</Link>
        </Button>
      </div>
    </form>
  );
}
