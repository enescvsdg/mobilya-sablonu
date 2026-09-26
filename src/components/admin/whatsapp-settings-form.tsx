"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveWhatsappNumberAction } from "@/app/admin/actions/site-settings";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWhatsappNumber, whatsappLink } from "@/lib/whatsapp";

/** Panelden denerken açılan mesaj; sitede ziyaretçinin dilindeki mesaj kullanılır. */
const TEST_MESSAGE = "Merhaba, bilgi alabilir miyim?";

export function WhatsappSettingsForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState(saveWhatsappNumberAction, undefined);
  const saved = state?.saved !== undefined ? state.saved || null : current;

  useEffect(() => {
    if (state?.saved === undefined) return;
    toast.success(state.saved ? "WhatsApp numarası kaydedildi." : "WhatsApp bağlantısı kaldırıldı.");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="whatsappNumber">WhatsApp numarası</Label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          type="tel"
          dir="ltr"
          defaultValue={current ? formatWhatsappNumber(current) : ""}
          placeholder="0555 123 45 67"
        />
        <p className="text-xs text-muted-foreground">
          0 ile ya da ülke koduyla (+90) yazabilirsiniz; boşluk ve tire önemli
          değil. Boş bırakıp kaydederseniz bağlantı sitede görünmez.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        {saved && (
          <a
            href={whatsappLink(saved, TEST_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
          >
            <WhatsappIcon className="size-4" />
            {formatWhatsappNumber(saved)} — WhatsApp&apos;ta dene
          </a>
        )}
      </div>
    </form>
  );
}
