"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProductVariantAction,
  moveProductVariantAction,
  saveProductVariantAction,
} from "@/app/admin/actions/variants";
import { ActionButton } from "@/components/admin/action-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { MediaTranslateButton } from "@/components/admin/media-translate-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProductVariantItem = {
  id: string;
  /** Türkçe ad. */
  name: string;
  colorHex: string;
  /** Dil kodu → ad (Türkçe dışındaki diller). */
  translations: Record<string, string>;
};

function VariantRow({
  variant,
  productId,
  index,
  total,
  languages,
}: {
  variant: ProductVariantItem;
  productId: string;
  index: number;
  total: number;
  languages: { code: string }[];
}) {
  const [state, action, pending] = useActionState(saveProductVariantAction, undefined);

  useEffect(() => {
    if (state && !state.error) toast.success("Varyant güncellendi.");
  }, [state]);

  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <form action={action} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="productId" value={productId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${variant.id}`} className="text-xs">
              Adı (TR)
            </Label>
            <Input
              id={`name-${variant.id}`}
              name="name"
              defaultValue={variant.name}
              required
              className="h-8 w-44 text-sm"
            />
          </div>
          {languages.map(({ code }) => (
            <div key={code} className="flex flex-col gap-1.5">
              <Label htmlFor={`name-${variant.id}-${code}`} className="text-xs">
                {code.toUpperCase()}
              </Label>
              <Input
                // Çeviri düğmesinden sonra sunucudan gelen yeni değer kutuya
                // yansısın; satırın kendisi (ve kayıt bildirimi) yerinde kalır.
                key={variant.translations[code] ?? ""}
                dir="auto"
                id={`name-${variant.id}-${code}`}
                name={`name_${code}`}
                defaultValue={variant.translations[code] ?? ""}
                placeholder="boşsa Türkçesi görünür"
                className="h-8 w-40 text-sm"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`colorHex-${variant.id}`} className="text-xs">
              Renk
            </Label>
            <Input
              id={`colorHex-${variant.id}`}
              name="colorHex"
              type="color"
              defaultValue={variant.colorHex || "#4a0e1e"}
              className="h-8 w-16 p-1"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "..." : "Kaydet"}
          </Button>
        </form>

        <div className="flex items-center gap-1">
          <ActionButton
            action={moveProductVariantAction.bind(null, variant.id, "up")}
            successMessage="Sıra güncellendi."
            size="icon"
            variant="ghost"
            title="Yukarı taşı"
            disabled={index === 0}
          >
            <ArrowUp className="size-4" />
          </ActionButton>
          <ActionButton
            action={moveProductVariantAction.bind(null, variant.id, "down")}
            successMessage="Sıra güncellendi."
            size="icon"
            variant="ghost"
            title="Aşağı taşı"
            disabled={index === total - 1}
          >
            <ArrowDown className="size-4" />
          </ActionButton>
          <DeleteButton
            action={deleteProductVariantAction.bind(null, variant.id)}
            confirmMessage={`"${variant.name}" varyantını silmek istediğine emin misin?`}
            label={`"${variant.name}" varyantını sil`}
          />
        </div>
      </div>

      {state?.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
    </li>
  );
}

export function ProductVariants({
  productId,
  variants,
  languages,
  translationEnabled = false,
}: {
  productId: string;
  variants: ProductVariantItem[];
  /** Türkçe dışındaki diller. */
  languages: { code: string }[];
  translationEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState(saveProductVariantAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
      toast.success("Varyant eklendi.");
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-5">
      <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="productId" value={productId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-name">Adı</Label>
          <Input
            id="variant-name"
            name="name"
            placeholder="Lacivert Kadife"
            required
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-color">Renk</Label>
          <Input
            id="variant-color"
            name="colorHex"
            type="color"
            defaultValue="#4a0e1e"
            className="w-16 p-1"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Ekleniyor..." : "Varyant Ekle"}
        </Button>
        {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      </form>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Henüz varyant yok. Kumaş, renk ya da ahşap seçenekleri burada
          tanımlanır.
        </p>
      ) : (
        <>
          {languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <MediaTranslateButton productId={productId} enabled={translationEnabled} />
              <p className="text-xs text-muted-foreground">
                Türkçe adları boş kalan dillere çevirip kaydeder; görsellerin boş
                alt metinleri de çevrilir.
              </p>
            </div>
          )}
          <ul className="flex flex-col gap-3">
            {variants.map((variant, index) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                productId={productId}
                index={index}
                total={variants.length}
                languages={languages}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
