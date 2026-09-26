/**
 * Google'ın zengin sonuçları için schema.org JSON-LD basar.
 * İçerik kendi veritabanımızdan gelse de `<` karakteri kaçırılır,
 * böylece bir metin alanına `</script>` yazılsa bile script kapanmaz.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
