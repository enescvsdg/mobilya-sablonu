import Link from "next/link";
import { Pencil, Plus, Star } from "lucide-react";

import { FEATURED_LIMIT, PRODUCT_ORDER } from "@/lib/featured";
import { prisma } from "@/lib/prisma";
import { getEditableLanguages } from "@/lib/languages";
import { deleteProductAction, toggleProductFeaturedAction } from "@/app/admin/actions/products";
import { ActionButton } from "@/components/admin/action-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function AdminProductsPage() {
  const admin = await requireView("products");
  const canEdit = allows(admin.permissions, "products", "edit");
  const languages = await getEditableLanguages();
  const primaryCode = languages[0]?.code ?? "tr";

  const products = await prisma.product.findMany({
    include: {
      translations: { where: { languageCode: primaryCode } },
      category: {
        include: { translations: { where: { languageCode: primaryCode } } },
      },
      _count: { select: { images: true, variants: true } },
    },
    orderBy: PRODUCT_ORDER,
  });

  // Ana sayfa yalnızca ilk FEATURED_LIMIT öne çıkan ürünü gösterir (aynı
  // sırayla); sığmayanlar yıldızı dolu olsa da sitede görünmez.
  const featuredOnSite = products.filter(
    (product) => product.isFeatured && product.isActive && product.category.isActive
  );
  const hiddenFeatured = featuredOnSite.slice(FEATURED_LIMIT);

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ürünler</h1>
        {canEdit && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              Yeni Ürün
            </Link>
          </Button>
        )}
      </div>

      {hiddenFeatured.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Ana sayfada en fazla {FEATURED_LIMIT} öne çıkan ürün görünür; şu an{" "}
          {featuredOnSite.length} ürün öne çıkarılmış.{" "}
          <strong>
            {hiddenFeatured.map((product) => product.translations[0]?.name ?? product.sku).join(", ")}
          </strong>{" "}
          ana sayfada görünmüyor. Görünmesini istediğiniz ürün için başka bir ürünün
          yıldızını kaldırın.
        </div>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Görsel</TableHead>
                <TableHead className="text-right">Varyant</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const name = product.translations[0]?.name ?? "—";
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="hover:underline"
                      >
                        {name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.category.translations[0]?.name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product._count.images}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product._count.variants}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Yayında" : "Taslak"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          action={toggleProductFeaturedAction.bind(null, product.id)}
                          successMessage={
                            product.isFeatured
                              ? "Öne çıkanlardan kaldırıldı."
                              : "Öne çıkanlara eklendi."
                          }
                          variant="ghost"
                          size="icon"
                          title={
                            product.isFeatured
                              ? "Öne çıkanlardan kaldır"
                              : "Bu ürünü öne çıkar"
                          }
                        >
                          <Star
                            className={`size-4 ${
                              product.isFeatured ? "fill-brand text-brand" : ""
                            }`}
                          />
                        </ActionButton>
                        <Button asChild variant="ghost" size="icon" title="Düzenle">
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <DeleteButton
                          action={deleteProductAction.bind(null, product.id)}
                          confirmMessage={`"${name}" ürününü silmek istediğine emin misin?`}
                          label={`"${name}" ürününü sil`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Henüz ürün yok.
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
