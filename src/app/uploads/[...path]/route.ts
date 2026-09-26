import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";

/**
 * Panelden yüklenen görselleri sunar.
 *
 * Next.js production sunucusu `public/` içeriğini derleme anında
 * listeler; derlemeden sonra oraya yazılan dosyalar 404 döner. Supabase
 * Storage tanımlı olmayan kurulumlarda (local geliştirme, kendi
 * sunucusunda barındırma) yüklenen görsellerin görünebilmesi için
 * dosyalar çalışma anında buradan okunur.
 */
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(_request: NextRequest, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;

  const filePath = path.join(UPLOAD_ROOT, ...segments);
  // Dizin dışına çıkmaya çalışan istekler (../) reddedilir.
  if (filePath !== UPLOAD_ROOT && !filePath.startsWith(UPLOAD_ROOT + path.sep)) {
    return notFound();
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) return notFound();

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return notFound();

    const file = await readFile(filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        // Dosya adları rastgele UUID olduğundan içerik hiç değişmez.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return notFound();
  }
}
