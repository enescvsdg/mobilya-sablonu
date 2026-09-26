"use client";

import { useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { saveCategoryAction, deleteCategoryCoverAction } from "@/app/admin/actions/categories";
import { ActionButton } from "@/components/admin/action-button";
import { ImageFileInput } from "@/components/admin/image-file-input";
import { TranslateFieldsButton } from "@/components/admin/translate-fields-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CategoryLanguage = { code: string; name: string; nativeName: string };

export type CategoryTranslationValues = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type CategoryInitialValues = {
  id: string;
  coverImage: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: Record<string, CategoryTranslationValues>;
};

export function CategoryForm({
  languages,
  initialValues,
  translationEnabled = false,
}: {
  languages: CategoryLanguage[];
  initialValues?: CategoryInitialValues;
  /** Otomatik çeviri (GEMINI_API_KEY) ayarlı mı. */
  translationEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = initialValues != null;

  useEffect(() => {
    if (state && !state.error) {
      // Düzenlemede alanlar dolu kalmalı; yeni kayıtta form temizlenir.
      if (!isEdit) formRef.current?.reset();
      toast.success(isEdit ? "Kategori güncellendi." : "Kategori eklendi.");
    }
  }, [state, isEdit]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-8">
      {initialValues && <input type="hidden" name="id" value={initialValues.id} />}

      <section className="flex flex-col gap-4">
        <TranslateFieldsButton
          kind="category"
          languages={languages}
          enabled={translationEnabled}
        />
        {languages.map((language, index) => {
          const values = initialValues?.translations[language.code];
          const required = index === 0;
          return (
            <div key={language.code} className="rounded-lg border p-4">
              <p className="text-sm font-semibold">
                {language.nativeName}
                <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                  {language.code}
                </span>
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`name_${language.code}`}>
                    İsim{required && " *"}
                  </Label>
                  <Input
                    dir="auto"
                    id={`name_${language.code}`}
                    name={`name_${language.code}`}
                    required={required}
                    defaultValue={values?.name}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`slug_${language.code}`}>Adres (slug)</Label>
                  <Input
                    id={`slug_${language.code}`}
                    name={`slug_${language.code}`}
                    placeholder="isimden otomatik üretilir"
                    defaultValue={values?.slug}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`description_${language.code}`}>Açıklama</Label>
                  <Textarea
                    dir="auto"
                    id={`description_${language.code}`}
                    name={`description_${language.code}`}
                    rows={2}
                    defaultValue={values?.description}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`seoTitle_${language.code}`}>SEO başlığı</Label>
                  <Input
                    dir="auto"
                    id={`seoTitle_${language.code}`}
                    name={`seoTitle_${language.code}`}
                    placeholder="boşsa kategori ismi kullanılır"
                    defaultValue={values?.seoTitle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`seoDescription_${language.code}`}>SEO açıklaması</Label>
                  <Input
                    dir="auto"
                    id={`seoDescription_${language.code}`}
                    name={`seoDescription_${language.code}`}
                    placeholder="boşsa açıklama kullanılır"
                    defaultValue={values?.seoDescription}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coverImage">Kapak görseli</Label>
          {initialValues?.coverImage && (
            <div className="flex items-center gap-3">
              <div className="relative size-24 overflow-hidden rounded-md border">
                <Image
                  src={initialValues.coverImage}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <ActionButton
                action={deleteCategoryCoverAction.bind(null, initialValues.id)}
                successMessage="Kapak görseli kaldırıldı."
                confirmMessage="Kapak görselini kaldırmak istediğine emin misin?"
                variant="outline"
              >
                Kaldır
              </ActionButton>
            </div>
          )}
          <ImageFileInput
            id="coverImage"
            name="coverImage"
            accept="image/jpeg,image/png,image/webp"
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG veya WebP. Büyük fotoğraflar yüklenmeden önce otomatik
            küçültülür. Boş bırakılırsa mevcut görsel korunur; görsel yoksa
            koleksiyon kartı marka renginde degrade ile gösterilir.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sortOrder">Sıra numarası</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              step="1"
              className="w-28"
              defaultValue={initialValues?.sortOrder ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Küçük numara önce gösterilir.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={initialValues?.isActive ?? true}
              />
              Yayında (sitede görünür)
            </label>
            <p className="text-xs text-muted-foreground">
              İşaret kaldırılırsa koleksiyon ve içindeki ürünler sitede görünmez.
            </p>
          </div>
        </div>
      </section>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kategori Ekle"}
        </Button>
      </div>
    </form>
  );
}
