"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * Site görselleri en fazla 1920 px dağıtır (next.config.ts, deviceSizes);
 * bundan büyüğü boşa taşınır ve yüksek çözünürlüklü aslı da açıkta kalmaz.
 */
const MAX_EDGE_PX = 1920;
/** Bu boyutun altındaki ve zaten küçük olan dosyalara dokunulmaz. */
const KEEP_BELOW_BYTES = 900 * 1024;
const QUALITY = 0.85;
/** next.config.ts'teki 4 MB istek sınırının altında, form alanlarına pay bırakır. */
const MAX_TOTAL_BYTES = 3.8 * 1024 * 1024;
const PENDING_MESSAGE = "Görsel hazırlanıyor, birkaç saniye bekleyin.";
const TOO_LARGE_MESSAGE =
  "Seçilen görseller tek seferde yüklenemeyecek kadar büyük — daha az görsel seçip birkaç seferde yükleyin.";
const UNREADABLE_MESSAGE =
  "Görsellerden biri hazırlanamadı. Fotoğrafı JPEG, PNG ya da WebP olarak kaydedip yeniden seçin.";

function encode(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Telefon fotoğrafları 3–10 MB olabiliyor; sunucu ise istek başına en
 * fazla 4 MB kabul ediyor (Vercel sınırı). Görseli tarayıcıda uzun kenarı
 * 1920 px olacak şekilde küçültüp WebP'ye (desteklemeyen Safari'de JPEG'e)
 * çevirir — gözle görülür kalite kaybı olmadan genelde 1 MB'ın altına iner.
 * 1920 px'ten büyük görselin küçültülmüşü, dosyası asıldan büyük çıksa da
 * kullanılır; küçültülemezse hata verir, asıl yüklenmez.
 */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= KEEP_BELOW_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await encode(canvas, "image/webp");
  if (blob?.type !== "image/webp") blob = await encode(canvas, "image/jpeg");
  if (!blob) {
    if (scale < 1) throw new Error("Görsel küçültülemedi.");
    return file;
  }
  // Boyutu zaten uygun görsel yalnızca yer kazandıracaksa değiştirilir.
  if (scale === 1 && blob.size >= file.size) return file;

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const name = `${file.name.replace(/\.[^.]+$/, "")}.${extension}`;
  return new File([blob], name, { type: blob.type });
}

/** Seçilen görselleri forma eklemeden önce küçülten dosya alanı. */
export function ImageFileInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    // Hata mesajı varken ya da hazırlık bitmeden form gönderilmeye
    // çalışılırsa tarayıcı gönderimi durdurup mesajı gösterir.
    const block = (text: string | null) => {
      input.setCustomValidity(text ?? "");
      setMessage(text);
    };

    if (files.length === 0) return block(null);

    block(PENDING_MESSAGE);
    let shrunk: File[];
    try {
      shrunk = await Promise.all(files.map(shrinkImage));
    } catch {
      // Tarayıcı açamadığı ya da küçültemediği bir görsel var; boyutu
      // bilinmediği için asıl dosya gönderilmez.
      return block(UNREADABLE_MESSAGE);
    }
    const transfer = new DataTransfer();
    for (const file of shrunk) transfer.items.add(file);
    input.files = transfer.files;

    const totalBytes = shrunk.reduce((sum, file) => sum + file.size, 0);
    block(totalBytes > MAX_TOTAL_BYTES ? TOO_LARGE_MESSAGE : null);
  };

  return (
    <>
      <Input
        {...props}
        type="file"
        onChange={(event) => {
          props.onChange?.(event);
          void handleChange(event);
        }}
      />
      {message && (
        <p
          className={
            message === PENDING_MESSAGE ? "text-xs text-muted-foreground" : "text-xs text-destructive"
          }
        >
          {message}
        </p>
      )}
    </>
  );
}
