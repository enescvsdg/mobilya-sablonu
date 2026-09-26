"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { toast } from "sonner";

import { fillMissingTranslationsAction } from "@/app/admin/actions/translations";
import { Button } from "@/components/ui/button";

/**
 * Ürün düzenleme ekranındaki varyant ve görsel bölümleri için: Türkçesi
 * yazılmış varyant adlarının ve alt metinlerin boş dillerini çevirip
 * hemen kaydeder. Dolu alanlara ve ürün formuna dokunmaz.
 */
export function MediaTranslateButton({
  productId,
  enabled,
}: {
  productId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        const result = await fillMissingTranslationsAction({
          kind: "product",
          id: productId,
          scope: "media",
        });
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        if (result.filled === 0) {
          toast.success("Boş dil yok; hepsi zaten çevrilmiş.");
        } else {
          const languages = result.languages.map((code) => code.toUpperCase()).join(", ");
          toast.success(`${result.filled} alan çevrilip kaydedildi (${languages}).`);
        }
        router.refresh();
      } catch {
        toast.error("Çeviri isteği gönderilemedi. Sayfayı yenileyip tekrar deneyin.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={!enabled || pending}
      title={enabled ? undefined : "Otomatik çeviri henüz ayarlanmadı"}
    >
      <Languages />
      {pending ? "Çevriliyor..." : "Boş dilleri Türkçeden çevir"}
    </Button>
  );
}
