# Mobilya sitesi şablonu

Mobilya markaları için çok dilli katalog sitesi ve yönetim paneli.

- **Site:** koleksiyonlar, ürün sayfaları, Hakkımızda, İletişim (teklif formu,
  WhatsApp, harita), Gizlilik Politikası ve Kullanım Şartları, "Yakında"
  sayfası; 10 dil (Türkçe, İngilizce, Rusça, Arapça hazır; Almanca, Fransızca,
  Farsça, Azerbaycan Türkçesi, İspanyolca, İtalyanca panelden açılır), SEO.
- **Panel** (`admin.<alan adı>`): ürünler, kategoriler, gelen talepler, site
  metinleri, diller, otomatik çeviri, kullanıcılar ve roller, işlem kaydı,
  site ayarları, Yardım.

Teknoloji: Next.js 16, Prisma 7 (PostgreSQL / Supabase), Auth.js, next-intl,
Tailwind CSS 4; yayın Vercel'de.

## Belgeler

- **YENI-MUSTERI.md** — yeni müşteri için adım adım kurulum
- **DEPLOYMENT.md** — hizmetlerin kurulumu, bakım, sorun giderme, geliştirici notları
- `src/config/brand.ts` — marka adı, logo, renkler, iletişim bilgileri

## Yerelde çalıştırma

```bash
docker compose up -d
cp .env.example .env        # AUTH_SECRET ve ADMIN_PASSWORD'ü doldurun
pnpm install
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

Site `http://localhost:3000`, panel `http://admin.localhost:3000/admin`.

## Testler

```bash
pnpm test:e2e
```
