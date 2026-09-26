"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { brand } from "@/config/brand";
import { InstagramIcon } from "@/components/site/instagram-icon";
import { WhatsappIcon } from "@/components/site/whatsapp-icon";
import styles from "./curtain-stage.module.css";

type SceneImage = { src: string; width: number; height: number };

const SCENE = {
  open: {
    landscape: { src: "/images/yakinda/yatay-acik.webp", width: 1672, height: 941 },
    portrait: { src: "/images/yakinda/dikey-acik.webp", width: 941, height: 1672 },
  },
  closed: {
    landscape: { src: "/images/yakinda/yatay-kapali.webp", width: 1672, height: 941 },
    portrait: { src: "/images/yakinda/dikey-kapali.webp", width: 941, height: 1672 },
  },
} satisfies Record<string, Record<"landscape" | "portrait", SceneImage>>;

/** Spot ışığında süzülen toz zerreleri; konumlar sabit ki sunucu ve tarayıcı aynı şeyi çizsin. */
const MOTES = [
  { x: 44, y: 22, size: 3, duration: 11, delay: 3.4, drift: 12, opacity: 0.7 },
  { x: 52, y: 30, size: 2, duration: 13, delay: 4.1, drift: -10, opacity: 0.55 },
  { x: 48, y: 44, size: 4, duration: 12, delay: 5.0, drift: 8, opacity: 0.45 },
  { x: 56, y: 18, size: 2, duration: 10, delay: 3.8, drift: -14, opacity: 0.6 },
  { x: 41, y: 36, size: 2, duration: 14, delay: 6.2, drift: 16, opacity: 0.5 },
  { x: 59, y: 40, size: 3, duration: 12, delay: 4.6, drift: -8, opacity: 0.5 },
  { x: 50, y: 14, size: 2, duration: 9, delay: 5.6, drift: 6, opacity: 0.65 },
  { x: 46, y: 52, size: 3, duration: 15, delay: 7.0, drift: -12, opacity: 0.4 },
  { x: 54, y: 48, size: 2, duration: 11, delay: 6.8, drift: 10, opacity: 0.55 },
  { x: 38, y: 26, size: 2, duration: 13, delay: 8.0, drift: 14, opacity: 0.45 },
  { x: 62, y: 28, size: 2, duration: 12, delay: 7.4, drift: -16, opacity: 0.45 },
  { x: 50, y: 60, size: 3, duration: 14, delay: 8.6, drift: -6, opacity: 0.35 },
];

/**
 * Aynı sahneyi yatay ekranda yatay, dikey ekranda dikey görselle gösterir.
 * Görseller zaten küçültülmüş WebP'lerdir ve doğrudan sunulur: görüntü
 * işleme servisinin ilk istekteki gecikmesi perdenin açılışını geciktirirdi.
 */
function ScenePicture({
  images,
  className,
  imageRef,
  part,
}: {
  images: Record<"landscape" | "portrait", SceneImage>;
  className: string;
  imageRef?: React.Ref<HTMLImageElement>;
  /** Betiksiz yedek stil (noscript) perde katmanlarını bununla bulur. */
  part: "scene" | "curtain";
}) {
  return (
    <picture>
      <source
        media="(orientation: portrait)"
        srcSet={images.portrait.src}
        width={images.portrait.width}
        height={images.portrait.height}
      />
      <img
        ref={imageRef}
        src={images.landscape.src}
        width={images.landscape.width}
        height={images.landscape.height}
        alt=""
        fetchPriority="high"
        decoding="async"
        draggable={false}
        className={className}
        data-part={part}
      />
    </picture>
  );
}

export type CurtainStageProps = {
  title: string;
  instagramLabel: string;
  instagramHandle: string;
  instagramUrl: string;
  whatsappLabel: string;
  /** Mesajı hazır yazılı WhatsApp bağlantısı; numara yoksa null. */
  whatsappUrl: string | null;
};

/**
 * "Yakında" sahnesi: karanlık salonda spot yanar, perde ortadan açılıp
 * yanlara toplanır, ardından "Çok Yakında" ve logo belirir. Perde
 * src/config/brand.ts'te kapatılabilir (features.comingSoonCurtain);
 * kapalıyken sahne marka renginde bir zeminle, yazılar daha erken açılır.
 * Hareketin tamamı CSS'tedir (curtain-stage.module.css); burada yalnızca
 * görseller yüklenince başlatılır.
 */
export function CurtainStage({
  title,
  instagramLabel,
  instagramHandle,
  instagramUrl,
  whatsappLabel,
  whatsappUrl,
}: CurtainStageProps) {
  const openRef = useRef<HTMLImageElement>(null);
  const closedRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images = [openRef.current, closedRef.current].filter(
      (image): image is HTMLImageElement => image !== null
    );
    const loaded = Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    // Görsel takılırsa sahne yine de açılsın.
    const fallback = new Promise((resolve) => setTimeout(resolve, 2500));

    Promise.race([loaded, fallback]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const curtain = brand.features.comingSoonCurtain;

  return (
    <div
      className={styles.root}
      data-ready={ready ? "" : undefined}
      data-curtain={curtain ? undefined : "off"}
      data-coming-soon=""
    >
      <div className={styles.stage} aria-hidden="true">
        {curtain ? (
          <ScenePicture images={SCENE.open} className={styles.layer} imageRef={openRef} part="scene" />
        ) : (
          <div className={styles.backdrop} />
        )}
        <div className={styles.glow} />
        <div className={styles.dust}>
          {MOTES.map((mote, index) => (
            <span
              key={index}
              className={styles.mote}
              style={
                {
                  "--x": `${mote.x}%`,
                  "--y": `${mote.y}%`,
                  "--size": `${mote.size}px`,
                  "--duration": `${mote.duration}s`,
                  "--delay": `${mote.delay}s`,
                  "--drift": `${mote.drift}px`,
                  "--opacity": mote.opacity,
                } as CSSProperties
              }
            />
          ))}
        </div>
        {curtain && (
          <>
            <ScenePicture
              images={SCENE.closed}
              className={`${styles.layer} ${styles.curtainLeft}`}
              imageRef={closedRef}
              part="curtain"
            />
            <ScenePicture
              images={SCENE.closed}
              className={`${styles.layer} ${styles.curtainRight}`}
              part="curtain"
            />
          </>
        )}
        <div className={styles.vignette} />
        <div className={styles.dark} data-part="dark" />
      </div>

      <main className={styles.content}>
        <h1 className={styles.title} data-part="reveal">
          {title}
        </h1>
        <span className={styles.divider} data-part="reveal" aria-hidden="true" />
        {/* Logo her dilde Latin kalır. */}
        <p className={styles.logo} lang="en" dir="ltr">
          <span className={styles.brand} data-part="reveal">
            {brand.logo.primary}
          </span>
          {brand.logo.secondary && (
            <span className={styles.yearRow}>
              <span className={`${styles.rule} ${styles.ruleLeft}`} data-part="rule" aria-hidden="true" />
              <span className={styles.year} data-part="reveal">
                {brand.logo.secondary}
              </span>
              <span className={`${styles.rule} ${styles.ruleRight}`} data-part="rule" aria-hidden="true" />
            </span>
          )}
        </p>

        {/* Dil seçici yok: sayfa ziyaretçinin tarayıcı diliyle açılır. */}
        <div className={styles.links}>
          <a
            className={styles.socialButton}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-part="reveal"
          >
            <InstagramIcon />
            <span className={styles.socialLabel}>{instagramLabel}</span>
            <span className={styles.socialDetail} dir="ltr">
              @{instagramHandle}
            </span>
          </a>
          {whatsappUrl && (
            <a
              className={styles.socialButton}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-part="reveal"
            >
              <WhatsappIcon />
              {/* Marka adı her dilde Latin harfle. */}
              <span className={styles.socialLabel} lang="en" dir="ltr">
                {whatsappLabel}
              </span>
            </a>
          )}
        </div>
      </main>

      {/* Betik çalışmazsa sahne açık hâliyle görünsün. */}
      <noscript>
        <style>
          {`[data-coming-soon] [data-part="dark"],[data-coming-soon] [data-part="curtain"]{display:none!important}
[data-coming-soon] [data-part="reveal"]{opacity:1!important}
[data-coming-soon] [data-part="rule"]{transform:none!important}`}
        </style>
      </noscript>
    </div>
  );
}
