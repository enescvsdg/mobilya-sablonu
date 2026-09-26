import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getEditableLanguages } from "@/lib/languages";
import { isTranslationConfigured } from "@/lib/translation";
import { deleteCategoryAction } from "@/app/admin/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

// Otomatik çeviri Google'ın yanıtını bekler; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

export default async function AdminCategoriesPage() {
  const admin = await requireView("categories");
  const canEdit = allows(admin.permissions, "categories", "edit");
  const [categories, languages] = await Promise.all([
    prisma.category.findMany({
      include: {
        translations: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getEditableLanguages(),
  ]);

  const primaryCode = languages[0]?.code ?? "tr";

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Kategoriler</h1>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm languages={languages} translationEnabled={isTranslationConfigured()} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Kapak</TableHead>
                {languages.map((language) => (
                  <TableHead key={language.code}>
                    {language.code.toUpperCase()}
                  </TableHead>
                ))}
                <TableHead className="text-right">Ürün</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const byLang = Object.fromEntries(
                  category.translations.map((t) => [t.languageCode, t.name])
                );
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.coverImage ? (
                        <div className="relative size-10 overflow-hidden rounded border">
                          <Image
                            src={category.coverImage}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-10 rounded border bg-neutral-100" />
                      )}
                    </TableCell>
                    {languages.map((language) => (
                      <TableCell key={language.code}>
                        {byLang[language.code] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums">
                      {category._count.products}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "secondary" : "outline"}>
                        {category.isActive ? "Yayında" : "Taslak"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Düzenle">
                          <Link href={`/admin/categories/${category.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <DeleteButton
                          action={deleteCategoryAction.bind(null, category.id)}
                          confirmMessage={`"${
                            byLang[primaryCode] ?? "Bu"
                          }" kategorisini silmek istediğine emin misin?`}
                          label={`"${byLang[primaryCode] ?? "Bu"}" kategorisini sil`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={languages.length + 4}
                    className="text-center text-muted-foreground"
                  >
                    Henüz kategori yok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ReadOnlySection>
  );
}
