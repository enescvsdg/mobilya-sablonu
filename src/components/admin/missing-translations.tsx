"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Languages, Loader2 } from "lucide-react";

import { fillMissingTranslationsAction } from "@/app/admin/actions/translations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TranslationGap } from "@/lib/translation-gaps";
import { ALT_FIELD_PREFIX, VARIANT_FIELD_PREFIX } from "@/lib/translation-rules";

const KIND_LABELS: Record<TranslationGap["kind"], string> = {
  product: "Ürün",
  category: "Kategori",
  content: "Site metni",
};

const FIELD_LABELS: Record<string, string> = {
  name: "isim",
  shortDescription: "kısa açıklama",
  description: "açıklama",
  materialsText: "malzemeler",
  seoTitle: "SEO başlığı",
  seoDescription: "SEO açıklaması",
  title: "başlık",
  body: "metin",
};

/** Ücretsiz katmanın dakikalık istek sınırına takılmamak için kayıtlar arası bekleme. */
const PAUSE_MS = 4_000;

type Status =
  | { state: "working" }
  | { state: "done"; text: string }
  | { state: "error"; text: string };

type Notice = { tone: "success" | "error"; text: string };

const keyOf = (item: TranslationGap) => `${item.kind}:${item.id}`;

/** "isim, açıklama, 2 varyant adı, 1 alt metin" */
function describeMissing(fields: string[]) {
  const variants = fields.filter((field) => field.startsWith(VARIANT_FIELD_PREFIX)).length;
  const alts = fields.filter((field) => field.startsWith(ALT_FIELD_PREFIX)).length;
  return [
    ...fields
      .filter((field) => !field.startsWith(VARIANT_FIELD_PREFIX) && !field.startsWith(ALT_FIELD_PREFIX))
      .map((field) => FIELD_LABELS[field] ?? field),
    ...(variants ? [`${variants} varyant adı`] : []),
    ...(alts ? [`${alts} alt metin`] : []),
  ].join(", ");
}

/**
 * Eksik çevirisi olan kayıtların listesi. Kayıtlar tek tek ya da sırayla
 * hepsi çevrilip kaydedilir. Liste sayfa açıldığı anki hâliyle kalır;
 * çevrilenler işaretlenir ve kontrol için açılabilir.
 */
export function MissingTranslations({
  items: initialItems,
  enabled,
}: {
  items: TranslationGap[];
  enabled: boolean;
}) {
  const [items] = useState(initialItems);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const stopRequested = useRef(false);

  const setStatus = (key: string, status: Status) =>
    setStatuses((current) => ({ ...current, [key]: status }));

  /** Tek kaydı çevirir; sıradakilerin de durması gerekiyorsa hata mesajını döndürür. */
  async function translateItem(item: TranslationGap): Promise<string | null> {
    const key = keyOf(item);
    setStatus(key, { state: "working" });
    let result: Awaited<ReturnType<typeof fillMissingTranslationsAction>>;
    try {
      result = await fillMissingTranslationsAction({ kind: item.kind, id: item.id });
    } catch {
      result = { error: "Bağlantı kurulamadı. Sayfayı yenileyip tekrar deneyin.", stop: true };
    }

    if ("error" in result) {
      setStatus(key, { state: "error", text: result.error });
      return result.stop ? result.error : null;
    }
    const languages = result.languages.map((code) => code.toUpperCase()).join(", ");
    setStatus(key, {
      state: "done",
      text:
        result.filled > 0
          ? `${result.filled} alan çevrildi (${languages}).`
          : "Çevrilecek alan kalmamış.",
    });
    return null;
  }

  async function translateOne(item: TranslationGap) {
    setRunning(true);
    setNotice(null);
    await translateItem(item);
    setRunning(false);
  }

  async function translateAll() {
    const queue = items.filter((item) => statuses[keyOf(item)]?.state !== "done");
    stopRequested.current = false;
    setRunning(true);
    setNotice(null);

    let done = 0;
    let stoppedWith: string | null = null;
    for (const [index, item] of queue.entries()) {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      if (stopRequested.current) break;
      stoppedWith = await translateItem(item);
      if (stoppedWith) break;
      done++;
    }

    setRunning(false);
    setNotice(
      stoppedWith
        ? {
            tone: "error",
            text: `${stoppedWith} ${done}/${queue.length} kayıt tamamlandı; kalanlar için daha sonra tekrar basın.`,
          }
        : {
            tone: "success",
            text: `${done}/${queue.length} kayıt işlendi. Çevirileri "Kontrol et" ile açıp gözden geçirebilirsiniz.`,
          }
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Eksik çeviri yok; Türkçesi yazılmış her alan diğer dillerde de dolu.
      </p>
    );
  }

  const remaining = items.filter((item) => statuses[keyOf(item)]?.state !== "done").length;

  return (
    <div className="flex flex-col gap-4">
      {!enabled && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          Otomatik çeviri henüz ayarlanmadı (Vercel&apos;de GEMINI_API_KEY eksik); adımlar
          Yardım sayfasında.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          {remaining > 0 ? (
            <>
              <strong>{remaining}</strong> kayıtta eksik çeviri var.
            </>
          ) : (
            "Listedeki tüm kayıtlar çevrildi."
          )}
        </p>
        <Button
          type="button"
          onClick={translateAll}
          disabled={!enabled || running || remaining === 0}
        >
          <Languages />
          {running ? "Çevriliyor..." : "Tümünü çevir"}
        </Button>
        {running && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stopRequested.current = true;
            }}
          >
            Durdur
          </Button>
        )}
      </div>

      <p
        role="status"
        className={notice?.tone === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}
      >
        {notice?.text}
      </p>

      <ul className="flex flex-col divide-y rounded-lg border">
        {items.map((item) => {
          const key = keyOf(item);
          const status = statuses[key];
          return (
            <li
              key={key}
              data-testid={`eksik-ceviri-${key}`}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <Badge variant="secondary">{KIND_LABELS[item.kind]}</Badge>
                  <span className="break-words">{item.label}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Object.entries(item.missing)
                    .map(([code, fields]) => `${code.toUpperCase()}: ${describeMissing(fields)}`)
                    .join(" · ")}
                </p>
                {status?.state === "done" && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                    <Check className="size-3.5" />
                    {status.text}
                  </p>
                )}
                {status?.state === "error" && (
                  <p className="mt-1 text-xs text-destructive">{status.text}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {status?.state === "working" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Çevriliyor...
                  </span>
                ) : status?.state !== "done" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => translateOne(item)}
                    disabled={!enabled || running}
                  >
                    Çevir
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href={item.editHref}>
                    {status?.state === "done" ? "Kontrol et" : "Aç"}
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
