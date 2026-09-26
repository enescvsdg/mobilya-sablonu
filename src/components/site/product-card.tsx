import Image from "next/image";

import { Link } from "@/i18n/navigation";

export function ProductCard({
  slug,
  name,
  shortDescription,
  imageUrl,
  className,
}: {
  slug: string;
  name: string;
  shortDescription?: string | null;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <Link href={`/urun/${slug}`} className={`group block ${className ?? ""}`}>
      <div className="relative aspect-square overflow-hidden bg-white">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <h3 className="mt-4 font-heading text-lg text-ink">{name}</h3>
      {shortDescription && (
        <p className="mt-1 font-body text-sm text-ink/60">{shortDescription}</p>
      )}
    </Link>
  );
}
