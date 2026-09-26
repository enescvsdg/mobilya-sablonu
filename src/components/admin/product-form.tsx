"use client";

import { useActionState } from "react";

import { saveProductAction } from "@/app/admin/actions/products";
import { ImageFileInput } from "@/components/admin/image-file-input";
import { TranslateFieldsButton } from "@/components/admin/translate-fields-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CategoryOption = { id: string; name: string };

export type ProductLanguage = { code: string; name: string; nativeName: string };

export type ProductTranslationValues = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  materialsText: string;
  seoTitle: string;
  seoDescription: string;
};

export type ProductInitialValues = {
  id: string;
  sku: string;
  categoryId: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  isActive: boolean;
  sortOrder: number;
  translations: Record<string, ProductTranslationValues>;
};

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export function ProductForm({
  categories,
  languages,
  initialValues,
  translationEnabled = false,
}: {
  categories: CategoryOption[];
  languages: ProductLanguage[];
  initialValues?: ProductInitialValues;
  /** Otomatik çeviri (GEMINI_API_KEY) ayarlı mı. */
  translationEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-8">
      {initialValues && <input type="hidden" name="id" value={initialValues.id} />}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" name="sku" defaultValue={initialValues?.sku} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Kategori *</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initialValues?.categoryId ?? ""}
            required
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Seç...
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="widthCm">Genişlik (cm)</Label>
          <Input
            id="widthCm"
            name="widthCm"
            type="number"
            step="0.1"
            defaultValue={initialValues?.widthCm}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="heightCm">Yükseklik (cm)</Label>
          <Input
            id="heightCm"
            name="heightCm"
            type="number"
            step="0.1"
            defaultValue={initialValues?.heightCm}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="depthCm">Derinlik (cm)</Label>
          <Input
            id="depthCm"
            name="depthCm"
            type="number"
            step="0.1"
            defaultValue={initialValues?.depthCm}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sortOrder">Sıra numarası</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            step="1"
            defaultValue={initialValues?.sortOrder ?? 0}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialValues?.isActive ?? true}
            />
            Yayında (sitede görünür)
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Çeviriler</h2>
        <TranslateFieldsButton
          kind="product"
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
                  <Label htmlFor={`name_${language.code}`}>İsim{required && " *"}</Label>
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
                  <Label htmlFor={`shortDescription_${language.code}`}>
                    Kısa açıklama (ürün kartında görünür)
                  </Label>
                  <Input
                    dir="auto"
                    id={`shortDescription_${language.code}`}
                    name={`shortDescription_${language.code}`}
                    defaultValue={values?.shortDescription}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`description_${language.code}`}>Açıklama</Label>
                  <Textarea
                    dir="auto"
                    id={`description_${language.code}`}
                    name={`description_${language.code}`}
                    rows={3}
                    defaultValue={values?.description}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor={`materialsText_${language.code}`}>
                    Malzemeler / el işçiliği notu
                  </Label>
                  <Textarea
                    dir="auto"
                    id={`materialsText_${language.code}`}
                    name={`materialsText_${language.code}`}
                    rows={2}
                    defaultValue={values?.materialsText}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`seoTitle_${language.code}`}>SEO başlığı</Label>
                  <Input
                    dir="auto"
                    id={`seoTitle_${language.code}`}
                    name={`seoTitle_${language.code}`}
                    placeholder="boşsa ürün ismi kullanılır"
                    defaultValue={values?.seoTitle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`seoDescription_${language.code}`}>SEO açıklaması</Label>
                  <Input
                    dir="auto"
                    id={`seoDescription_${language.code}`}
                    name={`seoDescription_${language.code}`}
                    placeholder="boşsa kısa açıklama kullanılır"
                    defaultValue={values?.seoDescription}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {!initialValues && (
        <section className="flex flex-col gap-2">
          <Label htmlFor="images">Görseller</Label>
          <ImageFileInput
            id="images"
            name="images"
            accept="image/jpeg,image/png,image/webp"
            multiple
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG veya WebP. Büyük fotoğraflar yüklenmeden önce otomatik
            küçültülür. Kaydettikten sonra sıralama, ana görsel ve alt metin
            düzenleme ekranından yönetilir.
          </p>
        </section>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : initialValues ? "Güncelle" : "Ürünü Kaydet"}
        </Button>
      </div>
    </form>
  );
}
