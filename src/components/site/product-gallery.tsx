"use client";

import { useState } from "react";
import Image from "next/image";

export type GalleryImage = { id: string; url: string; altText: string | null };

/**
 * Ürün detayındaki büyük görsel + küçük resim şeridi. Küçük resimler
 * gerçekten tıklanabilir/klavye erişilebilirdir (her biri farklı bir
 * açıyı gösterir) ve her biri kendi `altText`'ini taşır — ekran okuyucu
 * kullanıcıları hangi küçük resmin hangi görüntüyü açacağını bilir.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [selectedId, setSelectedId] = useState(images[0]?.id);
  const selected = images.find((image) => image.id === selectedId) ?? images[0];

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={selected.url}
          alt={selected.altText ?? productName}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => {
            const isSelected = image.id === selected.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedId(image.id)}
                aria-current={isSelected}
                aria-label={
                  image.altText ?? `${productName} — görsel ${index + 1}`
                }
                className={`relative aspect-square overflow-hidden bg-white outline-offset-2 ${
                  isSelected ? "ring-2 ring-brand" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
