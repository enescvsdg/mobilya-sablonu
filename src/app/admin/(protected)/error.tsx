"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">
        Bir şeyler ters gitti
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        İşlem tamamlanamadı. Lütfen tekrar deneyin; sorun sürerse sayfayı
        yenileyin.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-neutral-400">
          Hata kodu: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Tekrar dene
      </button>
    </div>
  );
}
