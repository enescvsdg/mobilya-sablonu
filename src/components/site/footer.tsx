import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { brand } from "@/config/brand";
import { siteConfig } from "@/lib/site-config";
import { InstagramIcon } from "@/components/site/instagram-icon";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: tNav("home") },
    { href: "/koleksiyonlar", label: tNav("collections") },
    { href: "/hakkimizda", label: tNav("about") },
    { href: "/iletisim", label: tNav("contact") },
  ];

  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p lang="en" className="font-logo text-2xl text-brand">
            {brand.logo.primary}
          </p>
          <p className="mt-3 max-w-xs font-body text-sm text-ink/70">
            {t("tagline")}
          </p>
        </div>

        <div>
          <p className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
            {t("quickLinks")}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-sm text-ink/80 transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
            {t("contactTitle")}
          </p>
          <p className="mt-4 font-body text-sm text-ink/80">
            {siteConfig.email}
          </p>

          <p className="mt-6 font-body text-xs font-semibold tracking-widest text-ink/50 uppercase">
            {t("followUs")}
          </p>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 font-body text-sm text-ink/80 transition-colors hover:text-brand"
          >
            <InstagramIcon className="size-4" />
            <span dir="ltr">@{siteConfig.instagramHandle}</span>
          </a>
        </div>
      </div>

      <div className="border-t border-hairline px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs text-ink/50">
            {/* Marka Latin kalır; sağdan sola dillerde sırası bozulmasın. */}
            <bdi>© {year} {brand.name}.</bdi> {t("rights")}
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/gizlilik-politikasi"
              className="font-body text-xs text-ink/50 transition-colors hover:text-brand"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/kullanim-sartlari"
              className="font-body text-xs text-ink/50 transition-colors hover:text-brand"
            >
              {t("terms")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
