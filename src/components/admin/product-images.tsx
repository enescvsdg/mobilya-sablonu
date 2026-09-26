"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProductImageAction,
  moveProductImageAction,
  setPrimaryProductImageAction,
  updateProductImageAltAction,
  uploadProductImagesAction,
} from "@/app/admin/actions/products";
import { ActionButton } from "@/components/admin/action-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageFileInput } from "@/components/admin/image-file-input";
import { MediaTranslateButton } from "@/components/admin/media-translate-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/action-result";

export type ProductImageItem = {
  id: string;
  url: string;
  /** Türkçe alt metin. */
  altText: string;
  isPrimary: boolean;
  /** Dil kodu → alt metin (Türkçe dışındaki diller). */
  translations: Record<string, string>;
};

function AltTextField({
  imageId,
  initial,
  languageCode,
  placeholder,
}: {
  imageId: string;
  initial: string;
  languageCode: string;
  placeholder: string;
}) {
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (value === initial) return;
    startTransition(async () => {
      try {
        await updateProductImageAltAction(imageId, value, languageCode);
        toast.success("Alt metin kaydedildi.");
      } catch {
        toast.error("Alt metin kaydedilemedi.");
      }
    });
  };

  return (
    <Input
      dir="auto"
      aria-label={`Alt metin (${languageCode.toUpperCase()})`}
      value={value}
      disabled={isPending}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      className="h-8 text-xs"
    />
  );
}

export function ProductImages({
  productId,
  images,
  languages,
  translationEnabled = false,
}: {
  productId: string;
  images: ProductImageItem[];
  /** Türkçe dışındaki diller. */
  languages: { code: string }[];
  translationEnabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, startUpload] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <form
        ref={formRef}
        action={(formData) =>
          startUpload(async () => {
            try {
              const result = await uploadProductImagesAction(productId, formData);
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              formRef.current?.reset();
              toast.success("Görseller yüklendi.");
            } catch (error) {
              console.error(error);
              toast.error(UNEXPECTED_ERROR_MESSAGE);
            }
          })
        }
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="images">Yeni görsel</Label>
          <ImageFileInput
            id="images"
            name="images"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
          />
        </div>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Yükleniyor..." : "Yükle"}
        </Button>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Henüz görsel yok. İlk yüklenen görsel otomatik olarak ana görsel olur.
        </p>
      ) : (
        <>
        {languages.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <MediaTranslateButton productId={productId} enabled={translationEnabled} />
            <p className="text-xs text-muted-foreground">
              Türkçe alt metinleri boş kalan dillere çevirip kaydeder; varyant
              adları da çevrilir.
            </p>
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-md border">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <AltTextField
                  key={`tr:${image.altText}`}
                  imageId={image.id}
                  initial={image.altText}
                  languageCode="tr"
                  placeholder="Görsel açıklaması, TR (boşsa ürün adı kullanılır)"
                />
                {languages.map(({ code }) => (
                  <AltTextField
                    // Çeviri sonrası yenilenen değer kutuya yansısın.
                    key={`${code}:${image.translations[code] ?? ""}`}
                    imageId={image.id}
                    initial={image.translations[code] ?? ""}
                    languageCode={code}
                    placeholder={`${code.toUpperCase()} (boşsa o dilin ürün adı kullanılır)`}
                  />
                ))}
                {image.isPrimary && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <Star className="size-3 fill-current" />
                    Ana görsel — listelerde ve paylaşımlarda bu kullanılır
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <ActionButton
                  action={moveProductImageAction.bind(null, image.id, "up")}
                  successMessage="Sıra güncellendi."
                  size="icon"
                  variant="ghost"
                  title="Yukarı taşı"
                  disabled={index === 0}
                >
                  <ArrowUp className="size-4" />
                </ActionButton>
                <ActionButton
                  action={moveProductImageAction.bind(null, image.id, "down")}
                  successMessage="Sıra güncellendi."
                  size="icon"
                  variant="ghost"
                  title="Aşağı taşı"
                  disabled={index === images.length - 1}
                >
                  <ArrowDown className="size-4" />
                </ActionButton>
                {!image.isPrimary && (
                  <ActionButton
                    action={setPrimaryProductImageAction.bind(null, image.id)}
                    successMessage="Ana görsel değiştirildi."
                  >
                    Ana görsel yap
                  </ActionButton>
                )}
                <DeleteButton
                  action={deleteProductImageAction.bind(null, image.id)}
                  confirmMessage="Bu görseli silmek istediğine emin misin?"
                  label="Görseli sil"
                />
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
