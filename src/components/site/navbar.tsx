import { getTranslations } from "next-intl/server";

import { brand } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import { isBuildSupported } from "@/lib/languages";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { MobileNav } from "@/components/site/mobile-nav";

export async function Navbar() {
  const t = await getTranslations("Nav");

  // Derlemede arayüz çevirisi olmayan bir dil menüde görünürse 404'e
  // götürür; bu yüzden yayındaki diller routing listesiyle kesiştirilir.
  const languages = (
    await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, nativeName: true },
    })
  ).filter((language) => isBuildSupported(language.code));

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/koleksiyonlar", label: t("collections") },
    { href: "/hakkimizda", label: t("about") },
    { href: "/iletisim", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* data-logo-part: giriş animasyonu logonun ineceği yeri buradan ölçer.
            Logo her dilde Latin ve soldan sağa kalır (Arapça sayfada da). */}
        <Link href="/" lang="en" dir="ltr" className="flex items-baseline gap-2">
          <span
            data-logo-part="primary"
            className="font-logo text-2xl tracking-wide text-highlight"
          >
            {brand.logo.primary}
          </span>
          {brand.logo.secondary && (
            <span
              data-logo-part="secondary"
              className="font-logo text-2xl tracking-wide text-highlight/60"
            >
              {brand.logo.secondary}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-body text-sm tracking-wide text-surface-warm/90 uppercase transition-colors hover:text-highlight"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <LanguageSwitcher languages={languages} />
        </div>

        <MobileNav navItems={navItems} languages={languages} />
      </div>
    </header>
  );
}
