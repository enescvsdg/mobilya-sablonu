"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { resetSiteContentAction, saveSiteContentAction } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/action-button";
import { ImageFileInput } from "@/components/admin/image-file-input";
import { TranslateFieldsButton } from "@/components/admin/translate-fields-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ContentLanguage = { code: string; name: string; nativeName: string };

export type ContentValues = { title: string; body: string; imageUrl: string };

export function SiteContentForm({
  contentKey,
  label,
  hint,
  fields,
  languages,
  values,
  currentImage,
  hasStoredValues,
  translationEnabled = false,
}: {
  contentKey: string;
  label: string;
  hint: string;
  fields: ("title" | "body" | "image")[];
  languages: ContentLanguage[];
  values: Record<string, ContentValues>;
  currentImage: string;
  hasStoredValues: boolean;
  /** Otomatik çeviri (GEMINI_API_KEY) ayarlı mı. */
  translationEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState(saveSiteContentAction, undefined);

  useEffect(() => {
    if (state?.savedKey === contentKey) toast.success("Kaydedildi.");
  }, [state, contentKey]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="key" value={contentKey} />

      <div>
        <h2 className="text-base font-semibold">{label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>

      <div className="flex flex-col gap-4">
        <TranslateFieldsButton
          kind="content"
          fields={fields.filter((field) => field !== "image")}
          languages={languages}
          enabled={translationEnabled}
        />
        {languages.map((language) => {
          const value = values[language.code];
          return (
            <div key={language.code} className="rounded-lg border p-4">
              <p className="text-sm font-semibold">
                {language.nativeName}
                <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                  {language.code}
                </span>
              </p>

              <div className="mt-3 flex flex-col gap-3">
                {fields.includes("title") && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${contentKey}-title-${language.code}`}>Başlık</Label>
                    <Input
                      dir="auto"
                      id={`${contentKey}-title-${language.code}`}
                      name={`title_${language.code}`}
                      defaultValue={value?.title}
                      placeholder="Boş bırakılırsa hazır metin kullanılır"
                    />
                  </div>
                )}
                {fields.includes("body") && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${contentKey}-body-${language.code}`}>Metin</Label>
                    <Textarea
                      dir="auto"
                      id={`${contentKey}-body-${language.code}`}
                      name={`body_${language.code}`}
                      rows={4}
                      defaultValue={value?.body}
                      placeholder="Boş bırakılırsa hazır metin kullanılır"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {fields.includes("image") && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${contentKey}-image`}>Görsel</Label>
          {currentImage && (
            <div className="relative h-32 w-56 overflow-hidden rounded-md border">
              <Image
                src={currentImage}
                alt=""
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          )}
          <ImageFileInput
            id={`${contentKey}-image`}
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG veya WebP. Büyük fotoğraflar yüklenmeden önce otomatik
            küçültülür. Boş bırakılırsa mevcut görsel korunur.
          </p>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        {hasStoredValues && (
          <ActionButton
            action={resetSiteContentAction.bind(null, contentKey)}
            successMessage="Bölüm hazır metinlere döndürüldü."
            confirmMessage="Bu bölümdeki tüm düzenlemeler silinip hazır metinlere dönülecek. Emin misin?"
            size="default"
          >
            Hazır metinlere dön
          </ActionButton>
        )}
      </div>
    </form>
  );
}
