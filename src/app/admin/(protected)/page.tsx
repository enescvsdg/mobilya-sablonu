import Link from "next/link";
import { Package, FolderTree, Inbox, Eye, Theater, Globe } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";
import { getEditableLanguageCodes } from "@/lib/languages";
import { findTranslationGaps } from "@/lib/translation-gaps";
import type { TranslatableKind } from "@/lib/translation-rules";
import { setComingSoonAction } from "@/app/admin/actions/site-settings";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  const can = (section: "products" | "categories" | "inquiries") =>
    allows(admin.permissions, section, "view");

  // Eksik çeviri sayısı yalnızca düzenleyebildiği bölümler için sayılır.
  const translationKinds = (
    [
      ["product", "products"],
      ["category", "categories"],
      ["content", "content"],
    ] as const
  )
    .filter(([, section]) => allows(admin.permissions, section, "edit"))
    .map(([kind]) => kind as TranslatableKind);

  const [productCount, categoryCount, newInquiryCount, settings, translationGaps] =
    await Promise.all([
      can("products") ? prisma.product.count() : 0,
      can("categories") ? prisma.category.count() : 0,
      can("inquiries") ? prisma.inquiry.count({ where: { status: "NEW" } }) : 0,
      getSiteSettings(),
      translationKinds.length > 0
        ? getEditableLanguageCodes().then((codes) => findTranslationGaps(translationKinds, codes))
        : [],
    ]);
  const canToggle = admin.isSuperAdmin;
  const { comingSoon } = settings;

  // Kutular yalnızca kişinin görebildiği bölümler için gösterilir.
  const stats = [
    can("products") && {
      label: "Ürünler",
      value: productCount,
      href: "/admin/products",
      icon: Package,
      highlight: false,
    },
    can("categories") && {
      label: "Kategoriler",
      value: categoryCount,
      href: "/admin/categories",
      icon: FolderTree,
      highlight: false,
    },
    can("inquiries") && {
      label: "Yeni Talepler",
      value: newInquiryCount,
      href: "/admin/inquiries",
      icon: Inbox,
      highlight: newInquiryCount > 0,
    },
    translationKinds.length > 0 && {
      label: "Eksik Çeviriler",
      value: translationGaps.length,
      href: "/admin/ceviriler",
      icon: Globe,
      highlight: translationGaps.length > 0,
    },
  ].filter((stat) => stat !== false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Panel</h1>

      <Card className={comingSoon ? "border-amber-300 bg-amber-50/60" : ""}>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Theater className="size-4" />
            Yakında Sayfası
          </CardTitle>
          <Badge
            variant={comingSoon ? "default" : "outline"}
            className={comingSoon ? "bg-amber-600" : ""}
          >
            {comingSoon ? "Açık" : "Kapalı"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            {comingSoon
              ? "Ziyaretçiler şu an yalnızca perde açılışlı Yakında sayfasını görüyor; sitenin geri kalanı gizli. Siz gerçek siteyi \"Siteyi önizle\" ile görebilirsiniz."
              : "Mağaza herkese açık: ziyaretçiler sitenin tamamını görüyor."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/admin/onizleme" target="_blank" rel="noopener">
                <Eye />
                Siteyi önizle
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/onizleme?yakinda" target="_blank" rel="noopener">
                <Theater />
                Yakında sayfasını gör
              </a>
            </Button>
            {canToggle && (
              <ActionButton
                action={setComingSoonAction.bind(null, !comingSoon)}
                variant={comingSoon ? "default" : "outline"}
                confirmMessage={
                  comingSoon
                    ? "Mağaza herkese açılacak: ziyaretçiler Yakında sayfası yerine sitenin tamamını görecek. Devam edilsin mi?"
                    : "Site ziyaretçilere kapanacak: herkes yalnızca Yakında sayfasını görecek. Devam edilsin mi?"
                }
                successMessage={
                  comingSoon
                    ? "Yakında sayfası kapatıldı, mağaza açık."
                    : "Yakında sayfası açıldı."
                }
              >
                {comingSoon ? "Mağazayı aç" : "Yakında sayfasını aç"}
              </ActionButton>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {canToggle
              ? "Değişiklik birkaç saniye içinde siteye yansır. Önizleme bağlantısı bu tarayıcıda 7 gün geçerlidir."
              : "Bu ayarı yalnızca Süper Yönetici değiştirebilir."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card
              className={`transition-colors hover:border-primary ${
                stat.highlight ? "border-primary" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
