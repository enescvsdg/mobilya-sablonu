import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

import { describeField, type TranslatableKind } from "@/lib/translation-rules";
import { brand } from "@/config/brand";

/**
 * Türkçe metinleri panelde diğer dillere çevirir (Google Gemini).
 *
 * Anahtar Vercel'de GEMINI_API_KEY olarak durur; Google AI Studio'nun
 * ücretsiz katmanı yeterlidir. Ücretsiz katmanda Flash modellerinin günlük
 * sınırı düşük olduğundan sınır dolunca sıradaki modele (en son
 * Flash-Lite) geçilir. Takma adlar ("-latest") Google'ın güncel modelini gösterir;
 * gerekirse GEMINI_MODELS="model-1,model-2" ile değiştirilir.
 *
 * Testlerde (TRANSLATION_FAKE=1) Google'a gidilmez; metnin başına dil
 * kodu eklenir. Canlıda (VERCEL_ENV=production) bu ayar yok sayılır.
 */

/** Alan adı → metin. */
export type FieldTexts = Record<string, string>;
/** Dil kodu → alan adı → metin. */
export type TranslatedTexts = Record<string, FieldTexts>;

export type TranslationErrorCode = "not_configured" | "rate_limit" | "invalid_key" | "failed";

/** Mesajı panelde olduğu gibi gösterilir. */
export class TranslationError extends Error {
  constructor(
    public readonly code: TranslationErrorCode,
    message: string
  ) {
    super(message);
  }
}

const MESSAGES: Record<TranslationErrorCode, string> = {
  not_configured:
    "Otomatik çeviri henüz ayarlanmadı (Vercel'de GEMINI_API_KEY eksik). Ayrıntılar Yardım sayfasında.",
  rate_limit:
    "Google'ın ücretsiz çeviri sınırı doldu. Bir dakika sonra tekrar deneyin; günlük sınır dolduysa ertesi gün sıfırlanır.",
  invalid_key:
    "Google çeviri anahtarı geçersiz ya da yetkisiz. Vercel'deki GEMINI_API_KEY değerini kontrol edin.",
  failed: "Çeviri şu an yapılamadı. Biraz sonra tekrar deneyin.",
};

/**
 * Sırayla denenir. Her modelin ücretsiz kotası ayrıdır; biri dolunca, o
 * projeye kapalıysa ya da Google onu kaldırdıysa sıradakine geçilir.
 */
const DEFAULT_MODELS = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-flash-lite-latest"];

/** Tek bir modelin yanıtı için beklenecek en uzun süre. */
const REQUEST_TIMEOUT_MS = 45_000;

const LANGUAGE_NOTES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  ru: "Russian (formal register, «вы»)",
  ar: "Arabic (Modern Standard Arabic; write the unit cm as سم)",
  de: "German (formal register, «Sie»)",
  fr: "French (formal register, «vous»)",
  fa: "Persian (Farsi as written in Iran; formal register; write the unit cm as سانتی‌متر)",
  az: "Azerbaijani (North Azerbaijani in Latin script, as used in Azerbaijan; formal register, «Siz»)",
  es: "Spanish (neutral international Spanish; formal register, «usted»)",
  it: "Italian (formal register, «Lei»)",
};

const SYSTEM_INSTRUCTION = `You translate website content for ${brand.name}, ${brand.translationContext}.

Translate every source field into every requested language and return only the JSON object described by the response schema.

Rules:
- Write natural, elegant copy suited to a quality furniture catalogue. Stay faithful to the source: do not add, drop or embellish information.
- Keep brand and model names in Latin letters exactly as written in the source: "${brand.name}", "${[brand.logo.primary, brand.logo.secondary].filter(Boolean).join(" ")}" and product model names (proper names such as "Milano" or "Chester"). Translate only the surrounding words, e.g. "Milano Koltuk" becomes "Milano Armchair" in English and "كرسي Milano" in Arabic.
- Keep numbers and measurements unchanged.
- Keep the line breaks and blank lines of the source exactly; blank lines separate paragraphs.
- Keep SEO titles and descriptions about as long as the source.
- If a field is only a brand or model name, return it unchanged.`;

function fakeMode() {
  return process.env.TRANSLATION_FAKE === "1" && process.env.VERCEL_ENV !== "production";
}

export function isTranslationConfigured() {
  return fakeMode() || Boolean(process.env.GEMINI_API_KEY?.trim());
}

function models() {
  const configured = process.env.GEMINI_MODELS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_MODELS;
}

function languageName(code: string) {
  return LANGUAGE_NOTES[code] ?? code;
}

function responseSchema(fieldNames: string[], targets: string[]) {
  const fieldsSchema = {
    type: "object",
    properties: Object.fromEntries(fieldNames.map((name) => [name, { type: "string" }])),
    required: fieldNames,
  };
  return {
    type: "object",
    properties: Object.fromEntries(targets.map((code) => [code, fieldsSchema])),
    required: targets,
  };
}

function parseResponse(text: string | undefined, fieldNames: string[], targets: string[]) {
  const fields = z.object(Object.fromEntries(fieldNames.map((name) => [name, z.string()])));
  const schema = z.object(Object.fromEntries(targets.map((code) => [code, fields])));

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    return null;
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return null;

  return Object.fromEntries(
    targets.map((code) => [
      code,
      Object.fromEntries(
        fieldNames.map((name) => [name, (parsed.data[code] as FieldTexts)[name].trim()])
      ),
    ])
  ) as TranslatedTexts;
}

/** ApiError iletisi Google'ın JSON yanıtıdır; içindeki açıklama alınır. */
function googleMessage(error: ApiError) {
  try {
    const parsed = JSON.parse(error.message) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // Düz metin ileti.
  }
  return error.message;
}

function fakeTranslate(source: FieldTexts, targets: string[]): TranslatedTexts {
  // Testlerin sınır dolması durumunu deneyebilmesi için.
  if (Object.values(source).some((text) => text.includes("[kota-dolu]"))) {
    throw new TranslationError("rate_limit", MESSAGES.rate_limit);
  }
  return Object.fromEntries(
    targets.map((code) => [
      code,
      Object.fromEntries(
        Object.entries(source).map(([name, text]) => [name, `${code.toUpperCase()}: ${text}`])
      ),
    ])
  );
}

/**
 * `source` alanlarını (varsayılan dilde) `targets` dillerine çevirir.
 * Boş alanlar gönderilmez; dönen nesnede her hedef dil için tüm alanlar
 * bulunur. Hata olursa mesajı Türkçe bir TranslationError fırlatılır.
 */
export async function translateFields(
  kind: TranslatableKind,
  sourceLanguage: string,
  source: FieldTexts,
  targets: string[]
): Promise<TranslatedTexts> {
  const fieldNames = Object.keys(source).filter((name) => source[name].trim() !== "");
  if (fieldNames.length === 0 || targets.length === 0) return {};
  const trimmedSource = Object.fromEntries(fieldNames.map((name) => [name, source[name].trim()]));

  if (fakeMode()) return fakeTranslate(trimmedSource, targets);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new TranslationError("not_configured", MESSAGES.not_configured);

  const prompt = JSON.stringify(
    {
      sourceLanguage: languageName(sourceLanguage),
      targetLanguages: Object.fromEntries(targets.map((code) => [code, languageName(code)])),
      fields: Object.fromEntries(
        fieldNames.map((name) => [
          name,
          { description: describeField(kind, name), text: trimmedSource[name] },
        ])
      ),
    },
    null,
    2
  );

  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
  let lastError: TranslationError | undefined;

  for (const model of models()) {
    // Düşük düşünme düzeyi çeviriyi hızlandırır. Model bu ayarı tanımıyorsa
    // aynı istek ayarsız tekrarlanır.
    for (const thinking of [true, false]) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema(fieldNames, targets),
            ...(thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
          },
        });

        const translated = parseResponse(response.text, fieldNames, targets);
        if (translated) return translated;

        console.error(
          `[ceviri] ${model} beklenen biçimde yanıt vermedi:`,
          response.candidates?.[0]?.finishReason,
          response.text?.slice(0, 500)
        );
        lastError = new TranslationError("failed", MESSAGES.failed);
        break;
      } catch (error) {
        if (!(error instanceof ApiError)) {
          console.error(`[ceviri] ${model} isteği tamamlanamadı:`, error);
          throw new TranslationError("failed", MESSAGES.failed);
        }

        const detail = googleMessage(error);
        console.error(`[ceviri] ${model} hata ${error.status}:`, detail.slice(0, 500));

        if (error.status === 400 && thinking && /thinking/i.test(detail)) continue;
        // Google'ın açıklaması sebebi söyler (ör. model yok, API projede
        // kapalı); anahtarın kendisini içermez.
        const reason = ` (Google: ${detail.slice(0, 300)})`;
        if (error.status === 400 && /api key/i.test(detail)) {
          // Anahtarın kendisi geçersiz; diğer modeller de aynı yanıtı verir.
          throw new TranslationError("invalid_key", MESSAGES.invalid_key + reason);
        }
        // Diğer durumlarda sıradaki model denenir; hepsi başarısız olursa
        // sonuncunun hatası gösterilir.
        if (error.status === 429) {
          lastError = new TranslationError("rate_limit", MESSAGES.rate_limit);
        } else if (error.status === 401 || error.status === 403) {
          // Anahtar ya da proje bu modele yetkili olmayabilir.
          lastError = new TranslationError("invalid_key", MESSAGES.invalid_key + reason);
        } else if (error.status === 404 || error.status >= 500) {
          lastError = new TranslationError("failed", MESSAGES.failed + reason);
        } else {
          throw new TranslationError("failed", MESSAGES.failed + reason);
        }
        // Sıradaki modele geçilir.
        break;
      }
    }
  }

  throw lastError ?? new TranslationError("failed", MESSAGES.failed);
}
