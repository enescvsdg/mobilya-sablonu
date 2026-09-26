const LETTER_MAP: Record<string, string> = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  ö: "o",
  ç: "c",
  Ğ: "g",
  Ü: "u",
  Ş: "s",
  İ: "i",
  Ö: "o",
  Ç: "c",
  // Dil paketi: ayrıştırılınca harfe inmeyen karakterler (Almanca,
  // Azerbaycan Türkçesi, Fransızca).
  ß: "ss",
  ə: "e",
  Ə: "e",
  œ: "oe",
  Œ: "oe",
  æ: "ae",
  Æ: "ae",
};

export function slugify(input: string): string {
  const normalized = input
    .split("")
    .map((char) => LETTER_MAP[char] ?? char)
    .join("");

  return normalized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
