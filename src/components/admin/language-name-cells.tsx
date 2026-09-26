"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { updateLanguageAction } from "@/app/admin/actions/languages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";

/**
 * "Adı" ve "Kendi dilinde" hücrelerini birlikte yönetir: normalde salt
 * okunurdur, kalem simgesine tıklanınca iki hücreyi kaplayan tek bir
 * satır içi forma döner. `colSpan` kullanmak yerine iki ayrı <TableCell>
 * döndürülür ki tablo sütun sayısı değişmesin.
 *
 * `useActionState` yerine doğrudan `useTransition` kullanılır: böylece
 * başarıda düzenleme modunu kapatmak bir effect içinde setState çağırmayı
 * gerektirmez (ActionButton'daki kalıpla aynı).
 */
export function LanguageNameCells({
  code,
  name,
  nativeName,
}: {
  code: string;
  name: string;
  nativeName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <>
        <TableCell>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 hover:underline"
            title="Dil adını düzenle"
          >
            {name}
            <Pencil className="size-3 text-muted-foreground" />
          </button>
        </TableCell>
        <TableCell>{nativeName}</TableCell>
      </>
    );
  }

  return (
    <TableCell colSpan={2}>
      <form
        action={(formData) =>
          startTransition(async () => {
            const result = await updateLanguageAction(undefined, formData);
            if (result?.error) {
              setError(result.error);
              return;
            }
            setError(null);
            setIsEditing(false);
            toast.success("Dil güncellendi.");
          })
        }
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="code" value={code} />
        <Input
          name="name"
          defaultValue={name}
          required
          className="h-8 w-32 text-sm"
          aria-label="Dil adı"
        />
        <Input
          name="nativeName"
          defaultValue={nativeName}
          className="h-8 w-32 text-sm"
          aria-label="Kendi dilinde adı"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "..." : "Kaydet"}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            setError(null);
            setIsEditing(false);
          }}
          title="Vazgeç"
        >
          <X className="size-4" />
        </Button>
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
      </form>
    </TableCell>
  );
}
