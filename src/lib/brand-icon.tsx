import { ImageResponse } from "next/og";

import { brand } from "@/config/brand";

/**
 * Sekme ve ana ekran simgesi: koyu marka zemininde, vurgu renginde ince
 * çerçeve ve logonun baş harfi (src/config/brand.ts). Müşterinin hazır bir
 * simgesi varsa src/app/icon.tsx ve apple-icon.tsx yerine aynı adlı .png
 * dosyaları konabilir (YENI-MUSTERI.md).
 */
export function brandIcon(size: number) {
  const { colors, logo } = brand;
  const frame = Math.round(size * 0.06);
  const border = Math.max(2, Math.round(size * 0.022));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: colors.brandDark,
          padding: frame,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `${border}px solid ${colors.highlight}`,
            borderRadius: Math.round(size * 0.1),
            color: colors.highlight,
            fontSize: Math.round(size * 0.58),
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {logo.primary.charAt(0)}
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
