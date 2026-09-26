import type { CSSProperties } from "react";

import { brand } from "@/config/brand";

/**
 * Marka renkleri CSS değişkeni olarak. Her kök layout bunu <html>'in
 * style'ına koyar; globals.css'teki Tailwind renkleri (bg-brand,
 * text-highlight, …) ve CSS modülleri bu değişkenleri okur. Böylece
 * renkler yalnızca src/config/brand.ts'te yazılıdır.
 */
export const brandCssVariables = {
  "--brand": brand.colors.brand,
  "--brand-dark": brand.colors.brandDark,
  "--highlight": brand.colors.highlight,
  "--highlight-light": brand.colors.highlightLight,
  "--surface": brand.colors.surface,
  "--surface-warm": brand.colors.surfaceWarm,
  "--ink": brand.colors.ink,
  "--hairline": brand.colors.hairline,
} as CSSProperties;

/**
 * "#rrggbb" + saydamlık → "rgba(r, g, b, a)". CSS değişkeninin
 * kullanılamadığı yerler için: e-postalar, paylaşım görseli, sekme simgesi.
 */
export function withAlpha(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
