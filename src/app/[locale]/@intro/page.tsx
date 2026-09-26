import { brand } from "@/config/brand";
import { IntroOverlay } from "@/components/site/intro-overlay";

/**
 * Giriş animasyonu yalnızca ana sayfada görünmeli ama <main> dışında
 * durmalı (dekoratif bir katman, sayfa metni değil). Paralel rota slotu
 * tam olarak bunu sağlar: bu dosya sadece /[locale] eşleştiğinde render
 * edilir, diğer sayfalarda default.tsx devreye girip hiçbir şey basmaz.
 * src/config/brand.ts'te kapatılabilir (features.introAnimation).
 */
export default function IntroSlot() {
  return brand.features.introAnimation ? <IntroOverlay /> : null;
}
