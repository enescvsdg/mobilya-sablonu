"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata ayrıntısı kullanıcıya gösterilmez; sunucu loglarında digest ile
    // eşleştirilebilmesi için konsola yazılır.
    console.error(error);
  }, [error]);

  const t = useTranslations("Error");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <h1 className="font-heading text-3xl text-brand sm:text-4xl">
        {t("errorTitle")}
      </h1>
      <p className="mt-4 font-body text-ink/70">{t("errorText")}</p>
      {error.digest && (
        <p className="mt-2 font-body text-xs text-ink/40">
          {t("errorCode", { code: error.digest })}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-10 border border-brand px-8 py-3 font-body text-sm tracking-widest text-brand uppercase transition-colors hover:bg-brand hover:text-surface-warm"
      >
        {t("retry")}
      </button>
    </div>
  );
}
