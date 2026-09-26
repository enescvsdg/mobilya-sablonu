import { useSyncExternalStore } from "react";

/**
 * Giriş animasyonunun durumu <html data-intro> üzerinde tutulur:
 * - yok  → animasyon oynuyor (katman sayfadaysa)
 * - "off" → hiç oynamadı ya da bitti
 *
 * "off" hem ilk boyamadan önce <body> başındaki betikle (tekrar gelen
 * ziyaretçi, hareket kısıtlaması) hem de animasyon bitince konur; böylece
 * site içinde ana sayfaya geri dönüldüğünde animasyon yeniden oynamaz.
 */
const DONE_EVENT = "site:intro-done";

/** Animasyon betiği hiç bitiremezse içerik yine de açılsın (CSS'teki 6 sn ile aynı). */
const FAILSAFE_MS = 6000;
let failsafeElapsed = false;

export function markIntroDone() {
  document.documentElement.dataset.intro = "off";
  window.dispatchEvent(new Event(DONE_EVENT));
}

function isIntroDone() {
  return (
    failsafeElapsed ||
    document.documentElement.dataset.intro === "off" ||
    !document.querySelector(".intro-overlay")
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener(DONE_EVENT, onChange);
  const timer = window.setTimeout(() => {
    failsafeElapsed = true;
    onChange();
  }, FAILSAFE_MS);
  return () => {
    window.removeEventListener(DONE_EVENT, onChange);
    window.clearTimeout(timer);
  };
}

/** Giriş animasyonu bittiyse (ya da hiç yoksa) true. */
export function useIntroDone() {
  return useSyncExternalStore(subscribe, isIntroDone, () => false);
}
