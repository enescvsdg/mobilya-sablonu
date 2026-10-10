# Mobilya şablonu: devir notu (2. oturum)

Bu notu yeni Claude Code oturumunda (`enescvsdg/mobilya-sablonu` deposunda) ilk
mesaj olarak yapıştırın. Önceki devir notunun devamıdır; oradaki bilgiler
(depolar, şablonun durumu, tespit edilen boşluklar) hâlâ geçerli.

## Çalışma şekli

Önce sorular, sonra yazılı plan, onaydan sonra uygulama. Bitince commit + push
+ PR'ı Claude açar. Depodaki `AGENTS.md` uyarısı geçerli: kod yazmadan önce
`node_modules/next/dist/docs/` altındaki ilgili rehber okunmalı.

## Onaylanan kararlar

- İlk iş: **yazı tipi ayarı + ikinci tema** (satış malzemesi, kurulum
  otomasyonu ve güncelleme taşıma sonraki oturumlara kaldı).
- İkinci tema **tasarım ayarları** olarak yapılacak (aynı sayfa düzeni; ayrı
  bileşen versiyonları değil).
- Yazı tipi seçimi **hazır eşleşmelerden** yapılacak.

## Uygulama planı (onay bekliyordu, ilk adıma başlanmadı)

İnceleme bulguları: bileşenler yazı tipini yalnızca `font-heading`,
`font-body`, `font-logo` ile kullanıyor (~95 yer); yazı tipi adları sadece
`src/lib/fonts.ts`, `src/app/globals.css` ve
`src/components/coming-soon/curtain-stage.module.css` (satır ~207, doğrudan
`--font-playfair`) içinde. `src/components/site/intro-overlay.tsx` logo
genişliğini Playfair'e göre hesaplıyor (~0,72 em).

1. `brand.ts`'e `typography` (eşleşme adı) ve `style` (`"classic"` |
   `"modern"`) anahtarları; `YENI-MUSTERI.md`'ye adım.
2. Eşleşmeler `src/lib/font-pairings/*.ts` (başlık, metin, logo + Kiril ve
   Arapça karşılıkları). `classic` = bugünkü Playfair + Montserrat (varsayılan,
   görünüm değişmez). Seçim derleme zamanında `next.config.ts`'te
   `resolveAlias` ile; olmazsa hepsi tek dosyada, `preload: false`.
   CSS'te genel adlar: `--font-pair-heading`, `--font-pair-body`,
   `--font-pair-logo`.
3. `style: "modern"`: `<html data-style>` + Tailwind 4 `modern:` varyantı ve
   CSS değişkenleri (köşe, düğme biçimi, harf aralığı, başlık kalınlığı, Ken
   Burns kapalı). Panel, e-posta, OG görseli etkilenmez.
4. Doğrulama: lint, tsc, `next build`, iki tema × TR/RU/AR ekran görüntüsü.
5. Dal + commit'ler + PR.

## Yeni ihtiyaç: İmza Mobilya ve Dekorasyon (yeni müşteri adayı)

Logo (kullanıcı ekran görüntüsü olarak paylaştı; asıl dosya firmadan
istenecek):

- Zemin kiremit/bordo kahve ≈ `#7f3c30` (koyusu `#743127`), altın ≈ `#c99b46`
  (açık `#debb63`, koyu `#b7822b`); arka planda sıva/kadife dokusu.
- "İMZA" Trajan tarzı Roma büyük harfli serif; İ'nin noktasından kelimenin
  üstüne kıvrılan altın süs çizgisi, ®. Alt satır "MOBİLYA VE DEKORASYON".
- Ton şablonun klasik/lüks temasına uygun.

Bundan çıkan şablon işleri (plana eklenecek):

- **Görsel logo desteği:** `brand.ts`'e SVG/PNG logo yolu; menü, alt bilgi,
  açılış animasyonu, OG görseli, e-posta bunu kullansın. Şu an logo yalnızca
  yazı.
- **`imperial` eşleşmesi:** Cinzel (başlık/logo; Kiril yok → yedek gerekir) +
  Cormorant veya Lato gibi bir metin yazı tipi.

Müşteri sitesi Bordo'daki gibi şablondan türetilmiş ayrı bir depoda kurulacak
(ör. `enescvsdg/imzamobilya`; açılması kullanıcı onayı ister).

## Bekleyen bilgiler

- Örnek site: **https://sefacan.com/** (Instagram:
  `@sefacanmobilyaaksesuar`). İmza'nın beğendiği/örnek aldığı site; ilişkisi
  netleşmedi. Önceki oturumda ağ izni yokken açılamadı. Kullanıcı ortamın
  Allowed domains listesine `sefacan.com`, `www.sefacan.com`, `share.google`,
  `www.google.com`, `maps.google.com` ekledi; yeni oturumda Playwright
  (Chromium hazır) ile masaüstü + mobil tam sayfa ekran görüntüsü alınıp,
  yazı tipleri ve renkler CSS'ten okunarak bölüm bölüm analiz yapılacak:
  ayarla aktarılabilir / bileşen gerekir / kapsam dışı.
- Firmanın Google işletme kaydı: https://share.google/b3FcIz5KAuvFpZao7
  (adres, telefon, saatler buradan alınacak).
- Instagram girişsiz görünmez; gerekirse kullanıcıdan ekran görüntüsü.
- Firmadan: vektör logo (SVG/AI/PDF) veya saydam PNG, resmî unvan, e-posta,
  alan adı.
- Telif: örnek sitenin tarzı/düzeni alınır; fotoğraf, metin, logo birebir
  kopyalanmaz.
