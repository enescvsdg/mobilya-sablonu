"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { createLanguageAction } from "@/app/admin/actions/languages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LanguageForm() {
  const [state, action, pending] = useActionState(createLanguageAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
      toast.success("Dil eklendi. Yayına almadan önce çevirileri tamamla.");
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Kod</Label>
        <Input
          id="code"
          name="code"
          placeholder="de"
          required
          className="w-24"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Adı</Label>
        <Input id="name" name="name" placeholder="Almanca" required className="w-44" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nativeName">Kendi dilinde</Label>
        <Input id="nativeName" name="nativeName" placeholder="Deutsch" className="w-44" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Ekleniyor..." : "Dil Ekle"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
