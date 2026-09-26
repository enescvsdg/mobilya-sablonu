# Yeni müşteri kurulumu

Bu şablondan yeni bir mobilya sitesi açmak için sıralı kontrol listesi.
Hizmetlerin (Supabase, Vercel, Resend, Gemini, alan adı) ayrıntılı
anlatımı **DEPLOYMENT.md**'dedir.

Şablondaki bütün değerler örnektir: **Örnek Mobilya**, `ornekmobilya.com`,
`info@example.com`, Kadıköy adresi ve 6 demo ürün.

## 0. Müşteriden alınacaklar

- [ ] Marka adı ve logoda yazacak kelimeler (ör. `ÖRNEK` + `MOBİLYA` ya da `ÖRNEK` + `1990`)
- [ ] Resmî şirket unvanı (Gizlilik Politikası'nda "veri sorumlusu" olarak geçer)
- [ ] Yetkili mahkeme şehri (Kullanım Şartları; genelde şirketin şehri)
- [ ] Renk tercihi (ana renk ve vurgu rengi) ya da logo dosyası
- [ ] İletişim e-postası, Instagram hesabı, WhatsApp numarası
- [ ] Mağaza adresi ve Google Haritalar'daki konumu
- [ ] Alan adı ve alan adı sağlayıcısı hesabına erişim
- [ ] Ürün fotoğrafları, kategori kapakları, ana sayfa ve Hakkımızda görselleri
- [ ] Hakkımızda metni (sonradan panelden de yazılabilir)
- [ ] Panelde kimler çalışacak, hangi rolle

## 1. Repo

1. Şablon deposunda **Use this template** → **Create a new repository**.
2. Ad: ör. `ornekmobilya.com`, **Private** → **Create repository**.

Yeni repo şablondan bağımsızdır; geçmişi tek, temiz bir kayıttan başlar.

## 2. Marka ayarları: `src/config/brand.ts`

Önce bu dosya düzenlenir. Menü, alt bilgi, açılış animasyonu, Yakında
sayfası, e-postalar, paylaşım görseli, sekme simgesi, Google'a verilen
şirket bilgisi ve yasal metinler buradan okunur.

| Alan | Ne yazılır |
|---|---|
| `name` | Görünen ad: `Örnek Mobilya` |
| `legalName` | Resmî unvan: `Örnek Mobilya San. ve Tic. Ltd. Şti.` |
| `courtCity` | Mahkeme şehri: `İstanbul` |
| `logo.primary` / `logo.secondary` | Logo yazısı. İkincisi soluk yazılır; istenmezse `""`. En fazla ~10 harf olması telefonda iyi görünür |
| `shareTagline` | WhatsApp/sosyal medya önizlemesindeki alt satır, büyük harfle |
| `translationContext` | Otomatik çeviriye markayı anlatan kısa İngilizce cümle |
| `colors` | `#rrggbb` renkler. `brand` ana renk, `brandDark` menü zemini, `highlight` vurgu (altın, pirinç vb.) |
| `contact` | E-posta, Instagram, adres, harita koordinatı (Google Haritalar'da mağazaya sağ tıklayınca çıkan iki sayı) |
| `features.introAnimation` | Ana sayfada logonun menüye uçtuğu açılış (`true`/`false`) |
| `features.comingSoonCurtain` | Yakında sayfasında perde sahnesi; görselleri olmadan açmayın (aşağıda) |

Renk seçerken: `highlight` rengi `brandDark` zemin üstünde okunmalı (menü
yazıları ve logo bu ikilidir).

## 3. Görseller

Ürün ve kategori görselleri panelden yüklenir (demo ürünler silinir ya da
düzenlenir). Sabit görseller `public/images/` altındadır; aynı adla
değiştirilir:

| Dosya | Nerede | Önerilen boyut |
|---|---|---|
| `hero-salon.jpg` | Ana sayfa açılışı (yazı solda durur) | 2200×933, yatay |
| `atolye-detay.jpg` | Ana sayfa el işçiliği bandı | 1772×2200, dikey |
| `malzeme-doku-kadife.jpg` | Ana sayfa alıntı bandı (üstü karartılır) | 2048×2048 |
| `marka-hikayesi-eskiz.jpg` | Hakkımızda | 2200×1476 |
| `categories/*.webp`, `products/*.webp` | Demo katalog | 1122×1402 |

Ana sayfa ve Hakkımızda görselleri panelde **Site Metinleri**'nden de
değiştirilebilir; kod değişikliği gerekmez.

- **Sekme simgesi:** logonun baş harfinden, marka renkleriyle kendiliğinden
  üretilir. Müşterinin hazır simgesi varsa `src/app/icon.png` (512×512) ve
  `src/app/apple-icon.png` (180×180) koyup `src/app/icon.tsx` ile
  `src/app/apple-icon.tsx`'i silin.
- **Paylaşım görseli** (`/og.png`): marka adı ve renklerinden üretilir.
  Tasarlanmış bir görsel için `public/og.png` (1200×630) koyup
  `src/app/og.png/` klasörünü silin.
- **Yakında perdesi:** `public/images/yakinda/` klasörüne dört görsel
  (`yatay-acik`, `yatay-kapali` 1672×941; `dikey-acik`, `dikey-kapali`
  941×1672, WebP) konur, sonra `features.comingSoonCurtain: true` yapılır.
  Görseller aynı sahnenin perdesi açık ve kapalı hâlidir; kumaş bölgesinin
  koordinatları `curtain-stage.module.css`'te ölçülüp güncellenir.

## 4. Metinler

- **Ana sayfa ve Hakkımızda metinleri** panelde **Site Metinleri**'nden
  yazılır. Boş bırakılan alanlarda `messages/<dil>.json`'daki genel metin
  görünür; o metinler de markadan bağımsızdır.
- `messages/*.json` içindeki `{brandName}`, `{legalName}`, `{courtCity}`
  kendiliğinden marka ayarıyla dolar; elle değiştirmeyin.
- **Gizlilik Politikası ve Kullanım Şartları** genel bir şablondur (KVKK,
  katalog sitesi, Türkiye hukuku). Yayından önce müşterinin avukatına
  okutun. Metin değişirse `src/lib/site-config.ts` → `LEGAL_LAST_UPDATED`
  tarihini güncelleyin.
- Arapça, Rusça ve diğer dillerdeki metinleri mümkünse o dili bilen birine
  okutun.

## 5. Hizmetler (DEPLOYMENT.md)

- [ ] Supabase projesi (bölge: Europe) → `DATABASE_URL`, Supabase URL ve gizli anahtar
- [ ] Vercel projesi → ortam değişkenleri → **Deploy**
- [ ] Alan adı: `ornekmobilya.com` ve **`admin.ornekmobilya.com`** Vercel'e ve DNS'e
- [ ] Resend (e-posta): alan adı doğrulama, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL`
- [ ] Gemini (otomatik çeviri): `GEMINI_API_KEY`
- [ ] GitHub → Settings → Secrets and variables → Actions: `SITE_URL` değişkeni (günlük uyandırma) ve `DATABASE_URL` secret'ı (haftalık yedek)
- [ ] Vercel planı: ücretsiz Hobby ticari kullanıma izin vermez; yayından önce **Pro**

## 6. Panelde ilk iş

1. `admin.ornekmobilya.com` → `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş.
   **Hesabım**'dan şifreyi değiştirin; sonra `ADMIN_PASSWORD`'ü Vercel'den silin.
2. **Site Ayarları** → WhatsApp numarası (boşken bağlantı görünmez).
3. **Kategoriler** ve **Ürünler**: demo kayıtları müşterinin ürünleriyle değiştirin.
4. **Site Metinleri**: ana sayfa ve Hakkımızda.
5. **Diller**: hangi diller yayında kalacak; yeni dil gerekiyorsa **Hazırlığa al**.
6. **Eksik Çeviriler** → **Tümünü çevir**, sonra gözden geçirin.
7. **Kullanıcılar**: müşteriye (ve bir yedeğine) Süper Yönetici, çalışanlarına
   rol (**Editör** ve **Satış** hazırdır).
8. Panel ana ekranı → **Siteyi önizle** ile kontrol; hazır olunca
   **Mağazayı aç**.

## 7. Teslim

- [ ] DEPLOYMENT.md → **Yayın sonrası kontrol listesi**
- [ ] Hesapların kimin adına açıldığı (GitHub, Vercel, Supabase, Resend,
      alan adı) yazılı olarak müşteriyle netleşti
- [ ] Şifreler ve anahtarlar müşteriye güvenli yoldan iletildi (e-postayla
      düz metin olarak değil)
- [ ] Panel kullanımı için panelde **Yardım** sayfası gösterildi

## Şablondaki bir iyileştirmeyi müşteriye taşımak

Müşteri repoları şablondan bağımsızdır (ortak geçmiş yoktur). Şablonda
yapılan bir düzeltme, değişen dosyalar müşteri reposuna kopyalanarak
taşınır. Marka ile ilgili her şey `src/config/brand.ts`, `public/images/`
ve panelde durduğu için kod dosyaları çoğunlukla olduğu gibi kopyalanabilir.
