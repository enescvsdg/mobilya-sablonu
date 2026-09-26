/**
 * Sayfa geçişlerinde görünen iskelet. Metin içermez, bu yüzden çeviri
 * gerektirmez ve her dilde aynı çalışır.
 */
export default function LocaleLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20" aria-hidden>
      <div className="h-10 w-64 animate-pulse rounded-sm bg-ink/10" />
      <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded-sm bg-ink/5" />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-sm bg-ink/5"
          />
        ))}
      </div>
    </div>
  );
}
