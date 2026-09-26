"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Languages } from "lucide-react";

import { translateFormFieldsAction } from "@/app/admin/actions/translations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/slugify";
import {
  needsTranslation,
  translatableFieldNames,
  TRANSLATION_SOURCE,
  type TranslatableKind,
} from "@/lib/translation-rules";

type Slot = { code: string; field: string; filled: boolean };
type Message = { tone: "success" | "error"; text: string };

/** Çeviriyle doldurulan alan, kullanıcı içine yazana kadar sarı görünür. */
const HIGHLIGHT = ["bg-amber-50", "ring-2", "ring-amber-300"];

function control(form: HTMLFormElement, name: string) {
  const element = form.elements.namedItem(name);
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ? element
    : null;
}

function highlight(element: HTMLInputElement | HTMLTextAreaElement) {
  element.classList.add(...HIGHLIGHT);
  element.addEventListener("input", () => element.classList.remove(...HIGHLIGHT), {
    once: true,
  });
}

/**
 * Formdaki Türkçe alanları diğer dillere çevirip formun kutularına yazar;
 * kaydetmez. Alanlar `<alan>_<dil kodu>` adını taşımalıdır (ör. name_en).
 * Dolu alanların üzerine yazmadan önce sorar. Çeviri açıksa, Türkçesi
 * yazılı ama başka dilde boş alan varken kaydedilmek istenince de sorar:
 * "Önce çevir" ya da "Çevirmeden kaydet".
 */
export function TranslateFieldsButton({
  kind,
  fields,
  languages,
  enabled,
}: {
  kind: TranslatableKind;
  /** Verilmezse türün tüm çevrilebilir alanları. */
  fields?: string[];
  /** Formda alanı olan diller; Türkçe kaynak, diğerleri hedeftir. */
  languages: { code: string }[];
  /** GEMINI_API_KEY tanımlı mı. */
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<{ filled: number; empty: number } | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [saveWarning, setSaveWarning] = useState<{ count: number; languages: string } | null>(
    null
  );
  /** "Çevirmeden kaydet" seçilince bir sonraki gönderim sorulmadan geçer. */
  const skipCheck = useRef(false);
  const submitter = useRef<HTMLElement | null>(null);

  // Kaydederken boş dil kontrolü. Dinleyici formun kendisinde ve yakalama
  // aşamasındadır: gönderim durdurulursa React'in form işlemi hiç çalışmaz.
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form || !enabled) return;

    const onSubmit = (event: SubmitEvent) => {
      if (skipCheck.current) {
        skipCheck.current = false;
        return;
      }
      const state = read();
      const empty = state?.slots.filter((slot) => !slot.filled) ?? [];
      if (empty.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      submitter.current = event.submitter;
      setSaveWarning({
        count: empty.length,
        languages: [...new Set(empty.map((slot) => slot.code.toUpperCase()))].join(", "),
      });
    };
    form.addEventListener("submit", onSubmit, { capture: true });
    return () => form.removeEventListener("submit", onSubmit, { capture: true });
  });

  const sourceCode = TRANSLATION_SOURCE;
  const targets = languages.filter((language) => language.code !== sourceCode);
  if (targets.length === 0 || targets.length === languages.length) return null;
  const fieldNames = fields ?? translatableFieldNames(kind);

  function read() {
    const form = ref.current?.closest("form");
    if (!form) return null;

    const source: Record<string, string> = {};
    for (const field of fieldNames) {
      const value = control(form, `${field}_${sourceCode}`)?.value.trim() ?? "";
      if (value) source[field] = value;
    }

    const slots: Slot[] = [];
    for (const { code } of targets) {
      for (const field of Object.keys(source)) {
        const element = control(form, `${field}_${code}`);
        if (element) {
          slots.push({ code, field, filled: !needsTranslation(field, element.value, source[field]) });
        }
      }
    }
    return { form, source, slots };
  }

  function start() {
    setMessage(null);
    const state = read();
    if (!state) return;
    if (Object.keys(state.source).length === 0) {
      setMessage({ tone: "error", text: "Önce Türkçe alanları doldurun." });
      return;
    }
    const filled = state.slots.filter((slot) => slot.filled).length;
    if (filled > 0) {
      setChoice({ filled, empty: state.slots.length - filled });
      return;
    }
    translate(false);
  }

  function translate(overwrite: boolean) {
    setChoice(null);
    const state = read();
    if (!state) return;

    const todo = state.slots.filter((slot) => overwrite || !slot.filled);
    if (todo.length === 0) return;
    const codes = [...new Set(todo.map((slot) => slot.code))];
    const sourceTexts = Object.fromEntries(
      [...new Set(todo.map((slot) => slot.field))].map((field) => [field, state.source[field]])
    );

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof translateFormFieldsAction>>;
      try {
        result = await translateFormFieldsAction({ kind, fields: sourceTexts, targets: codes });
      } catch {
        setMessage({
          tone: "error",
          text: "Çeviri isteği gönderilemedi. Sayfayı yenileyip tekrar deneyin.",
        });
        return;
      }
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      let count = 0;
      for (const slot of todo) {
        const text = result.translations[slot.code]?.[slot.field];
        const element = control(state.form, `${slot.field}_${slot.code}`);
        if (!text || !element) continue;
        if (slot.field === "name") {
          // İsimden otomatik üretilmiş adres (Türkçe isimden ya da bu dilin
          // eski isminden) boşaltılır; kaydedince yeni isimden yeniden
          // üretilir. Elle girilmiş adrese dokunulmaz.
          const slug = control(state.form, `slug_${slot.code}`);
          const generated = [state.source.name ?? "", element.value]
            .map((name) => slugify(name))
            .filter(Boolean);
          if (slug && generated.includes(slug.value.trim())) slug.value = "";
        }
        element.value = text;
        highlight(element);
        count++;
      }

      const languages = codes.map((code) => code.toUpperCase()).join(", ");
      setMessage({
        tone: "success",
        text: `${count} alan çevrildi (${languages}). Sarı alanları kontrol edip kaydedin.`,
      });
    });
  }

  function saveWithoutTranslating() {
    setSaveWarning(null);
    const form = ref.current?.closest("form");
    if (!form) return;
    skipCheck.current = true;
    const button = submitter.current;
    form.requestSubmit(button instanceof HTMLButtonElement ? button : undefined);
  }

  function translateBeforeSaving() {
    setSaveWarning(null);
    translate(false);
  }

  return (
    <div ref={ref} className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <Dialog open={saveWarning !== null} onOpenChange={(open) => !open && setSaveWarning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bazı dillerde boş alanlar var</DialogTitle>
            <DialogDescription>
              {saveWarning?.count} alanın Türkçesi yazılı ama {saveWarning?.languages} dilinde
              boş. Çevirmeden kaydederseniz sitede o dillerde boş kalır (isim boşsa Türkçesi
              görünür).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={saveWithoutTranslating}>
              Çevirmeden kaydet
            </Button>
            <Button type="button" onClick={translateBeforeSaving}>
              <Languages />
              Önce çevir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={start}
          disabled={!enabled || pending}
        >
          <Languages />
          {pending ? "Çevriliyor..." : "Türkçeden çevir"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? `Türkçe alanları ${targets.map((t) => t.code.toUpperCase()).join(", ")} alanlarına çevirir. Kaydetmeden önce kontrol edin.`
            : "Otomatik çeviri henüz ayarlanmadı; adımlar Yardım sayfasında."}
        </p>
      </div>

      {choice && (
        <div
          role="group"
          aria-label="Dolu alanlar"
          className="flex flex-col gap-2 rounded-md bg-muted/50 p-3 text-sm"
        >
          <p>
            {choice.filled} alan zaten dolu
            {choice.empty > 0 ? `, ${choice.empty} alan boş.` : "; boş alan yok."}
          </p>
          <div className="flex flex-wrap gap-2">
            {choice.empty > 0 && (
              <Button type="button" size="sm" onClick={() => translate(false)}>
                Yalnız boş alanları doldur
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => translate(true)}>
              Dolu alanların da üzerine yaz
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setChoice(null)}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}

      <p
        role="status"
        className={
          message?.tone === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"
        }
      >
        {message?.text}
      </p>
    </div>
  );
}
