import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("Error");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <p className="font-heading text-6xl text-highlight sm:text-7xl">404</p>
      <h1 className="mt-6 font-heading text-3xl text-brand sm:text-4xl">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-4 font-body text-ink/70">{t("notFoundText")}</p>
      <Link
        href="/"
        className="mt-10 border border-brand px-8 py-3 font-body text-sm tracking-widest text-brand uppercase transition-colors hover:bg-brand hover:text-surface-warm"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
