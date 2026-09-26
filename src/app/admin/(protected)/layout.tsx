import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Inbox,
  Languages,
  FileText,
  UserCog,
  HelpCircle,
  LogOut,
  Eye,
  Users,
  ShieldCheck,
  History,
  Globe,
  Settings,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/dal";
import { allows, type Section } from "@/lib/permissions";
import { logoutAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/config/brand";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Görmek için gereken bölüm yetkisi; yoksa herkese açık. */
  section?: Section;
  /** Bu bölümlerden en az birini düzenleme yetkisi yeterli. */
  editAnyOf?: Section[];
  superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/products", label: "Ürünler", icon: Package, section: "products" },
  { href: "/admin/categories", label: "Kategoriler", icon: FolderTree, section: "categories" },
  { href: "/admin/inquiries", label: "Talepler", icon: Inbox, section: "inquiries" },
  { href: "/admin/content", label: "Site Metinleri", icon: FileText, section: "content" },
  {
    href: "/admin/ceviriler",
    label: "Eksik Çeviriler",
    icon: Globe,
    editAnyOf: ["products", "categories", "content"],
  },
  { href: "/admin/languages", label: "Diller", icon: Languages, section: "languages" },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users, superAdminOnly: true },
  { href: "/admin/roller", label: "Roller", icon: ShieldCheck, superAdminOnly: true },
  { href: "/admin/islem-kaydi", label: "İşlem Kaydı", icon: History, superAdminOnly: true },
  { href: "/admin/site-ayarlari", label: "Site Ayarları", icon: Settings, superAdminOnly: true },
  { href: "/admin/account", label: "Hesabım", icon: UserCog },
  { href: "/admin/yardim", label: "Yardım", icon: HelpCircle },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  const canSeeInquiries = allows(admin.permissions, "inquiries", "view");
  const newInquiryCount = canSeeInquiries
    ? await prisma.inquiry.count({ where: { status: "NEW" } })
    : 0;
  const visibleItems = navItems.filter((item) =>
    item.superAdminOnly
      ? admin.isSuperAdmin
      : item.section
        ? allows(admin.permissions, item.section, "view")
        : item.editAnyOf
          ? item.editAnyOf.some((section) => allows(admin.permissions, section, "edit"))
          : true
  );

  return (
    // Mobilde menü üstte yatay şerit, masaüstünde solda sabit kenar çubuğu.
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b bg-muted/20 md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 md:block md:py-4">
          <div>
            <p className="text-sm font-semibold">{brand.name}</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <form action={logoutAction} className="md:hidden">
            <Button type="submit" variant="ghost" size="sm" className="gap-2">
              <LogOut className="size-4" />
              Çıkış
            </Button>
          </form>
        </div>

        <nav className="flex flex-1 gap-1 overflow-x-auto p-2 md:flex-col md:overflow-x-visible">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
              {item.href === "/admin/inquiries" && newInquiryCount > 0 && (
                <Badge className="md:ml-auto">{newInquiryCount}</Badge>
              )}
            </Link>
          ))}
          {/* Yakında modu açıkken gerçek siteyi yalnızca bu bağlantıyla gelenler görür. */}
          <a
            href="/admin/onizleme"
            target="_blank"
            rel="noopener"
            className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-accent-foreground md:mt-auto"
          >
            <Eye className="size-4" />
            Siteyi önizle
          </a>
        </nav>

        <div className="hidden border-t p-3 md:block">
          <p className="truncate px-1 text-xs font-medium">{admin.name}</p>
          <p className="truncate px-1 text-xs text-muted-foreground">
            {admin.email} · {admin.roleName}
          </p>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="size-4" />
              Çıkış Yap
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-background p-4 md:p-6">{children}</main>
      <Toaster />
    </div>
  );
}
