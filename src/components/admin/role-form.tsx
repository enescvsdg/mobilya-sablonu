"use client";

import { useActionState } from "react";
import Link from "next/link";

import { saveRoleAction } from "@/app/admin/actions/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LEVELS,
  LEVEL_LABELS,
  SECTIONS,
  SECTION_LABELS,
  type Permissions,
} from "@/lib/permissions";

const LEVEL_HINTS = {
  none: "Menüde görünmez",
  view: "Görür ama değiştiremez",
  edit: "Ekler, değiştirir, siler",
} as const;

export function RoleForm({ role }: { role?: { id: string; name: string; permissions: Permissions } }) {
  const [state, action, pending] = useActionState(saveRoleAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {role && <input type="hidden" name="id" value={role.id} />}
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="role-name">Rol adı</Label>
        <Input
          id="role-name"
          name="name"
          defaultValue={role?.name}
          placeholder="ör. Satış, Editör, Stajyer"
          required
          minLength={2}
          maxLength={40}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Bölüm yetkileri</legend>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Bölüm</th>
                {LEVELS.map((level) => (
                  <th key={level} className="px-3 py-2 text-center font-medium">
                    {LEVEL_LABELS[level]}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {LEVEL_HINTS[level]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <tr key={section} className="border-t">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    {SECTION_LABELS[section]}
                  </th>
                  {LEVELS.map((level) => (
                    <td key={level} className="px-3 py-2 text-center">
                      <input
                        type="radio"
                        name={`perm_${section}`}
                        value={level}
                        defaultChecked={(role?.permissions[section] ?? "none") === level}
                        aria-label={`${SECTION_LABELS[section]}: ${LEVEL_LABELS[level]}`}
                        className="size-4 accent-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Panel ana ekranı, Hesabım ve Yardım herkese açıktır. Kullanıcılar, Roller, İşlem
          Kaydı ve Yakında ayarı yalnızca Süper Yöneticiye açıktır.
        </p>
      </fieldset>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/roller">Vazgeç</Link>
        </Button>
      </div>
    </form>
  );
}
