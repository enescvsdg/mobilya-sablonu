"use client";

import { useEffect } from "react";

import { brand } from "@/config/brand";

/**
 * Kök layout'un kendisi çökerse devreye girer; bu yüzden kendi
 * `<html>`/`<body>` etiketlerini üretmek zorundadır ve çeviri altyapısına
 * güvenemez (metinler bilinçli olarak sabittir).
 */
export default function GlobalError({
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
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          backgroundColor: brand.colors.surface,
          color: brand.colors.ink,
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ color: brand.colors.brand, fontSize: "1.75rem", margin: 0 }}>
          Bir şeyler ters gitti
        </h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 2rem",
            border: `1px solid ${brand.colors.brand}`,
            background: "transparent",
            color: brand.colors.brand,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
