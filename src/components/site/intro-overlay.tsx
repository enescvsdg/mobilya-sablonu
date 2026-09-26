"use client";

import { useEffect, useRef } from "react";

import { brand } from "@/config/brand";
import { markIntroDone } from "@/lib/intro";
import { INTRO_SESSION_KEY } from "@/lib/intro-session";

/**
 * Ana sayfa giriş animasyonu.
 *
 * Tam ekran bulanık bir katman açılır, ortasında logo durur; logonun iki
 * parçası küçülerek navbar'daki yerlerine uçarken katman saydamlaşır, yani
 * arkadaki hero görseli bulanıktan nete geçer. Navbar logosu bu sırada
 * gizlidir (globals.css): uçan harfler onun tam yerine iner ve logonun
 * kendisi olur. Hero başlığı da animasyon bitene kadar bekler.
 *
 * Ölçüm gerektiren tek seferlik bir FLIP geçişi olduğu için animasyon
 * Web Animations API ile sürülür: hedef konum ancak çalışma anında
 * navbar'dan ölçülebiliyor.
 */

const HOLD_MS = 1300;
const FLIGHT_MS = 1700;
/** Logonun ikinci parçası, ilkinden bu kadar sonra yola çıkar. */
const YEAR_STAGGER_MS = 200;
const FADE_DELAY_MS = 1600;
const FADE_MS = 1600;
/** Yumuşak kalkış, uzun ve yavaş iniş — yazılar süzülerek yerine oturur. */
const EASE = "cubic-bezier(0.45, 0, 0.2, 1)";
/** Katman, en son biten hareket (ikinci parçanın inişi ya da perdenin kalkması) bitince kalkar. */
const FINISH_MS = Math.max(FADE_DELAY_MS + FADE_MS, HOLD_MS + YEAR_STAGGER_MS + FLIGHT_MS);
/** Navbar'daki ikinci parça %60 saydam; uçan parça da o tonda iner. */
const NAV_YEAR_OPACITY = 0.6;

/**
 * Büyük logonun yazı boyu. Uzun marka adları dar ekrana sığsın diye harf
 * sayısına göre küçülür (Playfair büyük harfi ~0,72 em genişliğinde).
 */
const LOGO_SIZE = `clamp(2.5rem, min(14vw, ${Math.floor(90 / (0.72 * brand.logo.primary.length))}vw), 9rem)`;

function rectOf(selector: string) {
  const node = document.querySelector(selector);
  return node ? node.getBoundingClientRect() : null;
}

export function IntroOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLSpanElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Katman süslemeden ibaret; bitince yeniden render etmeden gizlenir.
    const hide = () => {
      root.style.display = "none";
    };

    // Tekrar eden ziyaretçide, hareket kısıtlaması açıkken ya da site içinde
    // ana sayfaya geri dönülünce hiç oynatılmaz.
    if (document.documentElement.dataset.intro === "off") {
      hide();
      return;
    }

    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // Gizli sekmede depolama kapalı olabilir — animasyon yine oynar.
    }

    const animations: Animation[] = [];

    const fly = (element: HTMLElement, target: DOMRect, delay: number, extra?: Keyframe[]) => {
      const from = element.getBoundingClientRect();
      if (!from.width || !target.width) return;

      // Uçan yazılar navbar'dakiyle aynı yazı tipi ve harf aralığında;
      // genişlik oranı bu yüzden harf boyu oranına birebir eşit.
      const scale = target.width / from.width;
      const dx = target.left + target.width / 2 - (from.left + from.width / 2);
      const dy = target.top + target.height / 2 - (from.top + from.height / 2);
      const timing = { duration: FLIGHT_MS, delay, easing: EASE, fill: "forwards" } as const;

      animations.push(
        element.animate(
          [
            { transform: "translate(0px, 0px) scale(1)" },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          ],
          timing
        )
      );
      if (extra) animations.push(element.animate(extra, timing));
    };

    // Hedefler uçuş başlarken ölçülür: bu anda yazı tipleri yüklenmiş ve
    // logonun açılış büyümesi bitmiş olur, ölçüm kaymaz.
    const startFlight = () => {
      const primaryTarget = rectOf('[data-logo-part="primary"]');
      const yearTarget = rectOf('[data-logo-part="secondary"]');
      if (primaryRef.current && primaryTarget) fly(primaryRef.current, primaryTarget, 0);
      if (yearRef.current && yearTarget) {
        fly(yearRef.current, yearTarget, YEAR_STAGGER_MS, [
          { opacity: 1 },
          { opacity: NAV_YEAR_OPACITY },
        ]);
      }
      // Yalnızca ikinci parçanın iki yanındaki çizgiler solar; yazı görünür kalır.
      for (const rule of root.querySelectorAll<HTMLElement>("[data-intro-rule]")) {
        animations.push(
          rule.animate([{ opacity: 0.7 }, { opacity: 0 }], {
            duration: 700,
            easing: "ease-out",
            fill: "forwards",
          })
        );
      }
    };

    if (veilRef.current) {
      animations.push(
        veilRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: FADE_MS,
          delay: FADE_DELAY_MS,
          easing: "ease-in-out",
          fill: "forwards",
        })
      );
    }

    const flightTimer = window.setTimeout(startFlight, HOLD_MS);

    // Katman, navbar logosunun görünür olması ve başlığın açılması aynı
    // anda olur; uçan harfler tam navbar logosunun yerinde durduğu için
    // devir teslim görünmez.
    const finish = () => {
      window.clearTimeout(flightTimer);
      window.clearTimeout(finishTimer);
      for (const animation of animations) animation.cancel();
      hide();
      markIntroDone();
    };

    const finishTimer = window.setTimeout(finish, FINISH_MS);

    // Ziyaretçi bir şey yapmaya kalkarsa animasyon yolunu kapatmasın.
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    for (const event of events) {
      window.addEventListener(event, finish, { once: true, passive: true });
    }

    return () => {
      window.clearTimeout(flightTimer);
      window.clearTimeout(finishTimer);
      for (const event of events) window.removeEventListener(event, finish);
      for (const animation of animations) animation.cancel();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="intro-overlay pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      <div ref={veilRef} className="absolute inset-0 bg-brand-dark/45 backdrop-blur-sm" />

      {/* Harf aralığı navbar logosuyla aynı (tracking-wide) olmalı; aksi
          halde inişte harfler bir anda büyüyüp küçülüyormuş gibi görünür. */}
      <div lang="en" dir="ltr" className="intro-stage relative flex flex-col items-center">
        <span
          ref={primaryRef}
          className="block font-logo leading-none tracking-wide text-highlight"
          style={{ fontSize: LOGO_SIZE }}
        >
          {brand.logo.primary}
        </span>
        {brand.logo.secondary && (
          <div
            className="mt-[0.22em] flex w-full items-center gap-[0.5em] text-highlight"
            style={{ fontSize: LOGO_SIZE }}
          >
            <span data-intro-rule className="h-px min-w-[0.3em] flex-1 bg-current opacity-70" />
            <span
              ref={yearRef}
              className="block font-logo text-[0.32em] leading-none tracking-wide whitespace-nowrap text-highlight"
            >
              {brand.logo.secondary}
            </span>
            <span data-intro-rule className="h-px min-w-[0.3em] flex-1 bg-current opacity-70" />
          </div>
        )}
      </div>
    </div>
  );
}
