import { ImageResponse } from "next/og";

import { brand } from "@/config/brand";
import { withAlpha } from "@/lib/brand-theme";

// Klasör adı noktalı ("og.png") olduğu için proxy matcher bu yolu es geçer;
// yani dil önekiyle yönlendirilmez ve /og.png sabit kalır.
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };

/** Paylaşım görseli: marka renklerinde logo ve alt satır (src/config/brand.ts). */
export function GET() {
  const { colors, logo } = brand;
  // Uzun marka adları görsele sığsın diye yazı boyu harf sayısına göre küçülür.
  const letters = logo.primary.length + (logo.secondary ? logo.secondary.length + 1 : 0);
  const fontSize = Math.min(108, Math.floor(1500 / letters));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brandDark,
          backgroundImage: `radial-gradient(circle at 50% 35%, ${colors.brand} 0%, ${colors.brandDark} 65%)`,
          color: colors.surfaceWarm,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            letterSpacing: fontSize / 7,
          }}
        >
          <span style={{ fontSize, fontWeight: 700 }}>{logo.primary}</span>
          {logo.secondary && (
            <span style={{ fontSize, fontWeight: 300, color: colors.highlight }}>
              {logo.secondary}
            </span>
          )}
        </div>

        <div
          style={{
            width: 160,
            height: 2,
            marginTop: 40,
            marginBottom: 40,
            backgroundColor: colors.highlight,
          }}
        />

        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            color: withAlpha(colors.surfaceWarm, 0.75),
          }}
        >
          {brand.shareTagline}
        </div>
      </div>
    ),
    size
  );
}
