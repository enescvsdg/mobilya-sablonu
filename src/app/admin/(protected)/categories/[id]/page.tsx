import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEditableLanguages } from "@/lib/languages";
import { isTranslationConfigured } from "@/lib/translation";
import { CategoryForm } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

// Otomatik çeviri Google'ın yanıtını bekler; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireView("categories");
  const canEdit = allows(admin.permissions, "categories", "edit");
  const { id } = await params;

  const [category, languages] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    }),
    getEditableLanguages(),
  ]);

  if (!category) notFound();

  const translations = Object.fromEntries(
    category.translations.map((t) => [
      t.languageCode,
      {
        name: t.name,
        slug: t.slug,
        description: t.description ?? "",
        seoTitle: t.seoTitle ?? "",
        seoDescription: t.seoDescription ?? "",
      },
    ])
  );

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" title="Kategorilere dön">
          <Link href="/admin/categories">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Kategoriyi Düzenle</h1>
      </div>

      <Card>
        <CardContent>
          <CategoryForm
            languages={languages}
            translationEnabled={isTranslationConfigured()}
            initialValues={{
              id: category.id,
              coverImage: category.coverImage,
              isActive: category.isActive,
              sortOrder: category.sortOrder,
              translations,
            }}
          />
        </CardContent>
      </Card>
    </div>
    </ReadOnlySection>
  );
}
