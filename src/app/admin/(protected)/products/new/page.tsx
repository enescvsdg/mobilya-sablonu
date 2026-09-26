import { prisma } from "@/lib/prisma";
import { getEditableLanguages } from "@/lib/languages";
import { isTranslationConfigured } from "@/lib/translation";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireEdit } from "@/lib/dal";

// Otomatik çeviri Google'ın yanıtını bekler; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

export default async function NewProductPage() {
  await requireEdit("products");
  const [categories, languages] = await Promise.all([
    prisma.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    getEditableLanguages(),
  ]);

  const primaryCode = languages[0]?.code ?? "tr";
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name:
      category.translations.find((t) => t.languageCode === primaryCode)?.name ??
      category.translations[0]?.name ??
      category.id,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Yeni Ürün</h1>
      {categoryOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Önce en az bir kategori oluşturmalısın.
        </p>
      ) : (
        <Card>
          <CardContent>
            <ProductForm
              categories={categoryOptions}
              languages={languages}
              translationEnabled={isTranslationConfigured()}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
