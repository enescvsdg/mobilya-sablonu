# Yayına Alma Rehberi

Bu rehberde `ornekmobilya.com` müşterinin alan adı, **Örnek Mobilya** da
markanın adı yerine örnek olarak geçer. Yeni bir müşteri için sıralı
kontrol listesi **YENI-MUSTERI.md**'dedir; bu rehber her hizmetin
ayrıntısını anlatır.

Kod yayına hazır. Bu rehberdeki adımlar tarayıcıdan yapılır; **terminal
gerekmez**. Veritabanı tabloları, diller, ilk admin kullanıcısı, demo
katalog (3 kategori, 6 ürün) ve görsel klasörü ilk canlı yayında otomatik
kurulur.

## Nasıl çalışıyor?

| | Canlı site | Önizleme |
|---|---|---|
| GitHub dalı | `main` | `main` dışındaki her dal |
| Adres | ornekmobilya.com | Vercel'in verdiği geçici adres (`...vercel.app`) |
| Veritabanı | Supabase | **Aynı** Supabase veritabanı |
| Veritabanı güncellemesi | Her yayında otomatik | Yapılmaz |

- Bir değişiklik önce önizleme adresinde görülür; onaylanınca `main`
  dalına alınır ve canlı site kendiliğinden güncellenir.
- Önizleme canlıyla aynı veritabanını kullanır: önizlemede görülen ürünler
  gerçek ürünlerdir.
- Yönetim paneli yalnızca `admin.ornekmobilya.com` adresinde açılır;
  önizleme adreslerinde panel yoktur (panelde yapılan her değişiklik
  zaten anında canlıdadır).

## 1. Hesaplar

| Hizmet | Ne için | Giriş |
|---|---|---|
| GitHub | Sitenin kodu | Mevcut hesap |
| [Supabase](https://supabase.com) | Veritabanı ve ürün görselleri | Gmail ile |
| [Vercel](https://vercel.com) | Siteyi yayınlama | **Continue with GitHub** |
| Alan adı sağlayıcısı (GoDaddy, İsimtescil vb.) | Müşterinin alan adı | Müşterinin hesabı |

## 2. GitHub: müşterinin reposu

Her müşterinin kendi reposu olur; şablon deposuna dokunulmaz.

1. Şablon deposunda **Use this template** → **Create a new repository**.
2. **Owner:** siz (ya da müşteri), **Repository name:** ör. `ornekmobilya.com`,
   **Private**. **Create repository**.
3. Yeni repo tek bir temiz kayıtla açılır; varsayılan dalı `main`'dir.
   Vercel canlı siteyi bu daldan yayınlar.

## 3. Supabase: veritabanı

1. **New project**:
   - **Name:** müşterinin adı, ör. `ornek-mobilya`
   - **Database password:** yalnızca harf ve rakamdan oluşan, en az 16
     karakterlik bir şifre. `@ # / ? %` gibi işaretler bağlantı adresini
     bozar. Şifreyi bir kenara not edin.
   - **Region:** **Europe**. Supabase bu seçimde projeyi İrlanda'da
     (`eu-west-1`) açar; sitenin sunucusu da `vercel.json` ile aynı
     bölgededir (Dublin, `dub1`). Başka bir bölge seçilirse
     `vercel.json` da ona göre değiştirilmeli, yoksa sayfalar yavaşlar.
   - **Security:** **Enable Data API** kutusunun işaretini kaldırın. Site
     veritabanına doğrudan bağlanır, bu özelliği kullanmaz; kapalı olması
     tabloları internete açık bir API'den korur. Diğer kutulara dokunmayın.
   - **GitHub (optional):** bağlamayın.
2. Proje hazır olunca üstteki **Connect** düğmesi → **Session pooler**
   satırındaki adresi kopyalayın. `[YOUR-PASSWORD]` yazan yere şifrenizi
   yazın. Bu adres `DATABASE_URL` olacak.
   - "Direct connection" adresini kullanmayın: Vercel ona bağlanamaz.
3. **Project Settings** → **API Keys**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`. Tarayıcı adres
     çubuğundaki `.../project/abcd1234...` kısmından da çıkarılabilir:
     `https://abcd1234....supabase.co`
   - **service_role** (yeni panelde **Secret key**) → `SUPABASE_SERVICE_ROLE_KEY`.
     Bu anahtar gizlidir; yalnızca Vercel'e girilir, kimseyle paylaşılmaz.

Görsel klasörü (`product-images`) elle açılmaz; ilk yayında otomatik açılır.

## 4. Vercel: siteyi yayınlama

1. **Add New…** → **Project** → müşterinin reposunun yanındaki
   **Import**.
2. Framework, Build ve Install ayarlarına dokunmayın.
3. **Environment Variables** bölümüne aşağıdakileri tek tek ekleyin
   (Key kutusuna anahtar, Value kutusuna değer → **Add**). Hepsi tüm
   ortamlara eklenir; önizlemelerde zararsızdır.

   | Anahtar | Değer |
   |---|---|
   | `DATABASE_URL` | 3. adımdaki Session pooler adresi (şifre yazılmış hali) |
   | `AUTH_SECRET` | https://generate-secret.vercel.app/32 adresinin ürettiği metin |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role / Secret key |
   | `NEXT_PUBLIC_SITE_URL` | `https://ornekmobilya.com` |
   | `ADMIN_EMAIL` | Panele giriş e-postası |
   | `ADMIN_PASSWORD` | Geçici, güçlü bir şifre |

   `ADMIN_EMAIL` / `ADMIN_PASSWORD` yalnızca veritabanında hiç admin
   yokken, yani ilk yayında kullanılır. Panele ilk girişten sonra şifreyi
   **Hesabım** ekranından değiştirin; ardından `ADMIN_PASSWORD`'ü
   Vercel'den silebilirsiniz.

4. **Deploy**. İlk yayın 2–4 dakika sürer. Kayıtlarda (Build Logs) şu
   satırlar görünür:

   ```
   [kurulum] Veritabanı değişiklikleri uygulanıyor...
   10 dil eklendi.
   Admin kullanıcısı eklendi: ...
   3 kategori ve 6 demo ürün eklendi.
   [kurulum] SUPABASE_SERVICE_ROLE_KEY türü: gizli anahtar (sb_secret_)
   [kurulum] Görsel klasörü "product-images" açıldı.
   ```

   Anahtar türü satırında **"HERKESE AÇIK anahtar (sb_publishable_)"**
   yazıyorsa yanlış anahtar girilmiştir; panelden görsel yüklenemez.

5. Yayın bitince Vercel'in verdiği `...vercel.app` adresinde site açılır.

### E-posta gönderimi (Resend)

Site e-postaları [Resend](https://resend.com) üzerinden,
`noreply@ornekmobilya.com` gibi bir adresten gönderir. Bu adres için ayrı bir
posta kutusu gerekmez; Resend yalnızca gönderir. E-posta ayarlanmadan da
site çalışır, ama şunlar kapalı kalır:

| Özellik | E-posta yokken |
|---|---|
| Şifremi unuttum | Çalışmaz; ekranda "Süper Yöneticiye başvurun" yazar |
| Hesabım → şifre değiştirme | Onay kodu istenmez, mevcut şifreyle değişir |
| Kullanıcı davet etme | Davet gönderilemez |
| Yeni talep bildirimi | Gönderilmez; talepler yine **Gelen Talepler**'e düşer |

Kurulum:

1. resend.com'da şirket e-postasıyla hesap açın.
2. **Domains** → **Add Domain** → `ornekmobilya.com` (bölge: Ireland /
   eu-west-1).
3. Resend'in gösterdiği DNS kayıtlarını (TXT/MX; `send` ve
   `resend._domainkey` adlı) alan adı sağlayıcısının **DNS** ekranına birebir ekleyin.
   Mevcut kayıtlara dokunmayın; bu kayıtlar sitenin açılmasını etkilemez.
4. Resend alan adını **Verified** gösterince **API Keys** → **Create API
   Key** (izin: *Sending access*). Anahtar yalnızca bir kez gösterilir;
   doğrudan Vercel'e yapıştırın.
5. Vercel → **Settings** → **Environment Variables**:

   | Anahtar | Değer |
   |---|---|
   | `RESEND_API_KEY` | Resend'in verdiği anahtar |
   | `RESEND_FROM_EMAIL` | `Örnek Mobilya <noreply@ornekmobilya.com>` |
   | `ADMIN_NOTIFY_EMAIL` | Yeni talep bildirimlerinin gideceği gerçek bir adres (boşsa sitedeki iletişim adresine gider) |

   Anahtarın türü **Secret**, diğer ikisinin **Config**; ortam yalnızca
   **Production** (önizlemelerden gerçek e-posta gitmesin). Tür pencere
   başına seçildiği için anahtarı ayrı pencerede ekleyin.

6. **Deployments** → yanında **Production · Current** yazan yayın → **⋯** →
   **Redeploy**. (En üstteki satır çoğu zaman bir önizlemedir; onu yeniden
   yayınlamak canlıyı değiştirmez.) Ardından giriş ekranında **Şifremi
   unuttum** ile deneyin; e-posta birkaç saniyede gelmelidir.

### Gelen e-posta: info@ → müşterinin Gmail'i (isteğe bağlı)

Sitede görünen `info@ornekmobilya.com` gibi bir adres için posta kutusu
açmak gerekmez; [ImprovMX](https://improvmx.com) ücretsiz planıyla gelen
e-postalar müşterinin Gmail'ine yönlendirilir: `info` (ya da `*`, tüm
adresler) → müşterinin Gmail adresi. Alan adı sağlayıcısının DNS ekranı:

| Tür | Ad | Değer |
|---|---|---|
| MX | `@` | `mx1.improvmx.com` (öncelik 10) |
| MX | `@` | `mx2.improvmx.com` (öncelik 20) |
| TXT | `@` | `v=spf1 include:spf.improvmx.com ~all` |

Resend'de **Receiving** açılmamalı: ana alan adına kendi MX kaydını ekler ve
bu yönlendirmeyle çakışır.

Gmail tarafında:

- **Filtre:** `{to:ornekmobilya.com from:ornekmobilya.com}` → *Asla
  Spam'a gönderme* (yönlendirilen e-postalar yoksa spam'e düşebiliyor).
- **info@'dan gönderme:** Ayarlar → Hesaplar ve İçe Aktarma → Postaları şu
  adresten gönder → `info@ornekmobilya.com`; SMTP `smtp.resend.com`, port
  `587`, TLS, kullanıcı adı `resend`, şifre Resend'de bu iş için açılan ayrı
  bir API anahtarı. Anahtar yenilenirse buradaki şifre de güncellenmeli.
- Resend ücretsiz planının gönderim sınırı site ve Gmail için ortaktır.

### Otomatik çeviri (Google Gemini)

Paneldeki **Türkçeden çevir** düğmesi ve **Eksik Çeviriler** ekranı,
Türkçe metinleri [Gemini API](https://aistudio.google.com) ile yayındaki ve
hazırlıktaki diğer dillere çevirir. Ücretsiz katman yeterlidir; anahtar yokken
düğmeler kapalıdır, sitenin geri kalanı etkilenmez.

Kurulum:

1. [aistudio.google.com](https://aistudio.google.com) adresine müşterinin
   (ya da sizin) Google hesabıyla girin; koşulları kabul edin. Yeni açılmış
   hesaplarda Google projeyi reddedebilir; o zaman daha eski bir hesap
   kullanın (Sorun giderme).
2. **Get API key** → **Create API key** (yeni proje açmasına izin verin).
   Anahtar `AQ…` ile başlar (eski anahtarlarda `AIza…`); doğrudan
   Vercel'e yapıştırın, başka yere yazmayın.
3. **Faturalandırma (billing) açmayın.** Açılmadığı sürece proje ücretsiz
   katmanda kalır ve hiçbir koşulda ücret çıkmaz.
4. Vercel → **Settings** → **Environment Variables**: `GEMINI_API_KEY` =
   anahtar; tür **Secret**, ortam **Production**.
5. **Deployments** → **Production · Current** → **⋯** → **Redeploy**.
   Panelde bir ürünü açıp **Türkçeden çevir**'e basarak deneyin.

Nasıl çalışır:

- Modeller sırayla denenir: `gemini-flash-latest`, `gemini-3.6-flash`,
  en son `gemini-flash-lite-latest` (sınırı en yüksek). Bir modelin
  ücretsiz sınırı dolunca, projeye kapalıysa (403) ya da Google onu
  kaldırdıysa (404) sıradakine geçilir. Hepsi doluysa panel "ücretsiz
  çeviri sınırı doldu" der; dakikalık sınır bir dakikada, günlük sınır
  ertesi gün sıfırlanır. Diğer hatalarda mesajın sonunda Google'ın kendi
  açıklaması parantez içinde görünür. Sıra `GEMINI_MODELS="model-1,model-2"` (Config) ile
  değiştirilebilir; Google bir modeli kaldırırsa buradan yenisi yazılır.
- Ücretsiz katmanda Google gönderilen metinleri ürünlerini geliştirmek için
  kullanabilir. Gönderilen tek şey panelde yazılan ürün, kategori ve site
  metinleridir (zaten sitede yayımlanan içerik); müşteri bilgisi gönderilmez.
- Hatalar Vercel → **Logs** ekranında `[ceviri]` önekiyle görünür.

## 5. Alan adı

1. Vercel → proje → **Settings** → **Domains** → **Add**:
   - `ornekmobilya.com` (Vercel `www` yönlendirmesini de önerir, kabul edin)
   - `admin.ornekmobilya.com` — **bu olmadan panele girilemez**
2. Vercel her alan adı için eklenecek DNS kaydını gösterir (A ve CNAME).
3. Alan adı sağlayıcısında (ör. GoDaddy → **Alan Adlarım** → alan adı → **DNS**):
   - Sağlayıcının park sayfasına giden mevcut `@` (A) kaydını ve `www`
     (CNAME) kaydını Vercel'in verdiği değerlerle **değiştirin**.
   - `admin` adında yeni bir CNAME kaydı ekleyin, değerini Vercel'den alın.
   - Değerleri Vercel ekranından birebir kopyalayın.
4. Birkaç dakika–birkaç saat içinde Vercel alan adlarını **Valid** gösterir,
   SSL (https) sertifikası kendiliğinden kurulur. Sağlayıcının geçici
   sayfası bu adımla kalkar.

## 6. Canlıya açılış

- Vercel'in ücretsiz **Hobby** planı ticari kullanıma izin vermez. Site
  ziyaretçilere duyurulmadan önce **Settings** → **Billing** üzerinden
  **Pro** plana geçin (aylık ücretli).
- Supabase'in ücretsiz planında bir hafta hiç kullanılmayan proje
  duraklatılır. Bunu aşağıdaki günlük uyandırma önler. Yine de duraklarsa
  Supabase panelindeki **Restore** ile açılır.
- **Yakında modu:** Mağaza açılana kadar ziyaretçiler yalnızca "Yakında"
  sayfasını görür (yeni bir veritabanında açık başlar).
  Panelin ana ekranındaki **Yakında Sayfası** kutusundan Süper Yönetici
  **Mağazayı aç** diyerek siteyi herkese açar. O zamana kadar gerçek site
  panelden **Siteyi önizle** ile görülür.
- **WhatsApp:** İletişim sayfasındaki "Bize Ulaşın" bölümünde ve Yakında
  sayfasında WhatsApp bağlantısı vardır; tıklayan ziyaretçiye kendi dilinde
  hazır bir mesaj yazılı gelir. Numara boş başlar (bağlantı görünmez);
  Süper Yönetici panelde **Site Ayarları**'ndan girer, değiştirir ya da
  boşaltıp bağlantıyı kaldırır.

## 6a. Bakım: günlük uyandırma ve haftalık yedek

İkisi de GitHub'ın zamanlanmış görevleriyle, ücretsiz çalışır
(`.github/workflows/`). Durumları GitHub'da repo → **Actions** sekmesinde
görünür. Biri başarısız olursa GitHub hesap sahibine e-posta gönderir.

- **Siteyi uyanık tut** (her gün): sitede veritabanını kullanan bir
  sayfayı açar; Supabase projeyi duraklatmaz. Yakında modunda sayfa ana
  sayfaya yönlenir, o istekte de mod veritabanından okunur. Sayfa açılmazsa
  iş başarısız olur; bu aynı zamanda "site ayakta mı" kontrolüdür.
- **Veritabanı yedeği** (her pazar): ürünler, metinler, talepler ve
  ayarların tam kopyası; 90 gün saklanır. Görseller bu yedeğe dahil değildir
  (Supabase deposunda durur; asıllarını ayrıca saklayın).

**Çalışmaları için bir kez** (ikisi de ayar yokken hata vermeden atlanır):
GitHub'da repo → **Settings** → **Secrets and variables** → **Actions**:

- **Variables** → **New repository variable** → Name: `SITE_URL`, Value:
  `https://ornekmobilya.com` (uyandırma bunu açar).
- **Secrets** → **New repository secret** → Name: `DATABASE_URL`, Secret:
  Vercel'e girdiğiniz veritabanı adresinin aynısı (yedek). Veritabanı
  şifresi değişirse bu değeri de güncelleyin.

**Elle çalıştırmak:** Actions → soldan iş akışı → **Run workflow**.

**Yedeği indirmek:** Actions → **Veritabanı yedeği** → bir çalışma →
sayfanın altındaki **Artifacts** bölümündeki `site-YYYY-AA-GG.dump`.
Dosyada müşteri talepleri ve panel şifre özetleri bulunur; paylaşmayın.

## 7. Yayın sonrası kontrol listesi

- [ ] `ornekmobilya.com` açılıyor, dile göre `/tr`, `/en`, `/ru` veya `/ar`'a gidiyor
- [ ] Yakında modu açıkken Yakında sayfası görünüyor; `/tr/koleksiyonlar` gibi adresler `/tr`'ye dönüyor
- [ ] Panelden **Siteyi önizle** ile gerçek site açılıyor, sol altta "Önizleme modu" rozeti var
- [ ] `www.ornekmobilya.com` → `ornekmobilya.com`'a yönleniyor
- [ ] Koleksiyonlar, ürün detayı, Hakkımızda, İletişim sayfaları açılıyor
- [ ] `admin.ornekmobilya.com` → giriş yapılabiliyor; şifre **Hesabım**'dan değiştirildi
- [ ] (Resend kurulduysa) **Şifremi unuttum** e-postası geliyor, bağlantı `https://admin.ornekmobilya.com` ile başlıyor
- [ ] `ornekmobilya.com/admin` → "sayfa bulunamadı" veriyor (panel gizli)
- [ ] Panelden bir ürüne görsel yüklendi ve sitede göründü
- [ ] İletişim formu gönderildi, **Gelen Talepler**'de göründü
- [ ] İletişim sayfasındaki **WhatsApp** bağlantısı doğru sohbeti hazır mesajla açıyor
- [ ] Telefonda menü ve sayfalar düzgün
- [ ] (İsteğe bağlı) Google Search Console'a `https://ornekmobilya.com/sitemap.xml` eklendi

## Sorun giderme

| Belirti | Neden / Çözüm |
|---|---|
| Yayın "DATABASE_URL tanımlı değil" ile duruyor | Değişkeni ekleyin → **Deployments** → son yayın → **Redeploy** |
| Yayın `P1001` / "Can't reach database" ile duruyor | Session pooler yerine Direct adres girilmiş ya da adres eksik kopyalanmış |
| Yayın "password authentication failed" ile duruyor | Adresteki şifre yanlış ya da özel karakter içeriyor. Supabase → Database → **Reset password** ile yalnızca harf/rakam şifre verin, adresi güncelleyin |
| Panelde "Görsel depolama ayarlanmamış" | Supabase URL / anahtar eksik → ekleyip Redeploy |
| Panelde "Görsel yüklenemedi: Supabase anahtarı yetkisiz" | `SUPABASE_SERVICE_ROLE_KEY`'e yanlış anahtar girilmiş. Kayıtlardaki "anahtar türü" satırına bakın; Secret keys bölümündeki `sb_secret_` anahtarını girip Redeploy |
| Panelde "product-images klasörü yok" | Yeniden yayınlayın (Redeploy); klasör kurulum sırasında veritabanından açılır |
| Panele girişte "Çok fazla hatalı deneme" | 5 hatalı şifreden sonra giriş 15 dakika kilitlenir; süre dolunca tekrar deneyin |
| Şifre / davet / onay kodu e-postası gelmiyor | Spam klasörüne bakın. Resend → **Domains**'te alan adı **Verified** mi? Vercel'de `RESEND_API_KEY` ve `RESEND_FROM_EMAIL` var mı (sonra Redeploy)? Resend → **Emails** ekranında gönderim ve hata görünür |
| "Oturumunuz sona erdi" ile girişe atıldı | Şifre değişti ya da hesap pasif yapıldı / silindi: tüm açık oturumlar kapanır. Yeniden giriş yapın |
| Çalışan bir bölümü göremiyor ya da "yetkiniz yok" görüyor | Rolünün o bölüm için yetkisi yok. **Roller** ekranından rolü düzenleyin; değişiklik hemen geçerli olur |
| "E-posta gönderimi henüz ayarlanmadı" yazıyor ama Vercel'de değişkenler var | Değişken ekledikten sonra **Production** yayını yeniden başlatılmamış (önizleme yeniden yayınlanmış olabilir). Production · Current yayını → Redeploy |
| Yeni yayından hemen sonra bir formda "Bir şeyler ters gitti" | Sayfa eski yayından açık kalmış; sayfayı yenileyip tekrar deneyin |
| `info@` adresine gelen e-posta ulaşmıyor | ImprovMX panelinde alan adı yeşil (aktif) mi? DNS'te MX kayıtları duruyor mu? Gmail'de Spam klasörü ve filtre |
| Panelde "Otomatik çeviri henüz ayarlanmadı" | Vercel'de `GEMINI_API_KEY` yok ya da ekledikten sonra Production yayını yeniden başlatılmamış → Redeploy |
| Çeviride "anahtar geçersiz ya da yetkisiz" | Anahtar eksik/yanlış kopyalanmış ya da AI Studio'da silinmiş. Yeni anahtar oluşturup Vercel'de değiştirin, Redeploy |
| Çeviride "ücretsiz çeviri sınırı doldu" | Bir dakika bekleyip tekrar deneyin; sürüyorsa günlük sınır dolmuştur, ertesi gün sıfırlanır |
| Çeviride "(Google: Your project has been denied access…)" | Google bu projeyi Gemini'ye kapatmış (genelde yeni hesaplarda). Başka, daha eski bir Google hesabının AI Studio'sundan anahtar alıp Vercel'de değiştirin → Redeploy |
| Çeviride "(Google: …)" ile biten bir hata | Parantez içi Google'ın kendi açıklamasıdır; Vercel → Logs'ta `[ceviri]` satırlarına bakın |
| Panel adresi açılmıyor | `admin.<alan adı>` Vercel'e ve DNS'e eklenmemiş |
| "Mağazayı aç" dendi ama site hâlâ Yakında sayfası | Ayar birkaç saniye önbellekte tutulur; 10–15 saniye sonra sayfayı yenileyin. Tarayıcınızda önizleme açıksa zaten gerçek siteyi görürsünüz; ziyaretçi gözüyle bakmak için gizli pencere kullanın |
| "Siteyi önizle" gerçek siteyi açmıyor | Bağlantı bir dakika geçerlidir; paneldeki bağlantıya yeniden tıklayın. Önizleme, bağlantının açıldığı tarayıcıda 7 gün sürer |

Başarısız bir yayında canlı site bozulmaz, önceki haliyle çalışmaya devam
eder.

## Geliştirici notları

- `pnpm build` = `prisma generate` → `scripts/production-setup.mjs` →
  `next build`. Kurulum betiği yalnızca `VERCEL_ENV=production` iken
  çalışır: `prisma migrate deploy`, `prisma db seed`, Supabase Storage
  bucket'ı. Yerelde, CI'da ve önizlemede hiçbir şey yapmaz.
- Migration'lar canlı yayında otomatik uygulanır. Yıkıcı bir şema
  değişikliğinde (sütun silme vb.) yeni kod yayına çıkana kadar geçen
  birkaç dakikada eski kod yeni şemayla çalışır; bu tür değişiklikler
  iki adımda (önce kod, sonra şema) yayınlanmalı.
- Önizlemeler canlı veritabanını kullanır: şema değiştiren bir dal, canlıya
  alınana kadar önizlemede hata verebilir. Eklemeli şema değişikliklerini
  (yeni tablo/sütun) önce tek başına `main`'e alın, özelliği sonra
  önizlemede deneyin. Vercel önizleme adreslerinde admin alt alan adı
  olmadığı için panel orada `/admin` altında açılır (önizleme adresleri
  Vercel oturumu ister).
- Otomatik çeviri: `src/lib/translation.ts` (Gemini, `@google/genai`,
  JSON şemalı çıktı, model sırası ve hata eşlemesi),
  `src/lib/translation-gaps.ts` (eksik alan bulma ve kaydetme),
  `src/lib/translation-rules.ts` (alan listesi; boş ya da Türkçesiyle aynı
  isim "çevrilmemiş" sayılır). e2e'de `TRANSLATION_FAKE=1` ile Google'a
  gidilmez (`playwright.config.ts`); canlıda bu ayar yok sayılır. Çeviri
  kullanan panel sayfalarında `maxDuration = 60`.
- Yakında modu: `site_settings.comingSoon` (tek satır). `src/proxy.ts`
  ayarı ve yayındaki dilleri `src/lib/site-gate.ts` ile tek sorguda okur
  (tek bağlantılık `pg` havuzu, 10 sn bellek önbelleği;
  `COMING_SOON_CACHE_MS` ile değişir, e2e'de 0). Mod açıkken `/<dil>` →
  `/yakinda/<dil>` (rewrite), diğer yollar → `/<dil>` (307). Veritabanına
  ulaşılamazsa bilinen son değer, hiç okunamadıysa "açık" ve yalnızca
  varsayılan dil kabul edilir.
- Önizleme: `/admin/onizleme` (oturum ister) 60 sn'lik HMAC imzalı
  bağlantı üretir → ana sitede `/onizleme` doğrular ve 7 günlük imzalı
  `site_onizleme` çerezini bırakır (`AUTH_SECRET` ile, `src/lib/preview.ts`).
  `site_onizleme_ui` yalnızca rozet içindir, yetki vermez.
- `/yakinda/[locale]` kendi kök layout'una sahiptir. `dynamicParams = false`
  koymayın: sayfa yeniden üretilirken (ör. `revalidatePath("/", "layout")`)
  Next.js yolu `[locale]/[...rest]`'e düşürüp 404 üretir.
- Görsel klasörü (bucket) doğrudan veritabanından (`storage.buckets`)
  açılır, anahtara bağlı değildir; Supabase dışı bir veritabanında
  Storage API'sine düşer. Anahtarın türü (değeri değil) kayda yazılır.
- Panel girişi `login_attempts` tablosuyla sınırlanır: 15 dakikada e-posta
  başına 5, IP başına 20 hatalı deneme (`src/lib/login-throttle.ts`).
  Sınır Auth.js `authorize` içinde olduğundan `/api/auth` istekleri de
  kapsanır; ana alan adında `/api` zaten 404 döner.
- Panel kullanıcıları: `admin_users.role` `SUPER_ADMIN` ya da `EDITOR`
  (çalışan). Çalışanın yetkisi `staff_roles.permissions` JSON'undadır:
  bölüm başına `none` / `view` / `edit` (`src/lib/permissions.ts`).
  Kullanıcılar, Roller, İşlem Kaydı ve Yakında ayarı yalnızca Süper
  Yöneticiye açıktır. Son etkin Süper Yönetici silinemez / pasif
  yapılamaz / rolü değişemez; kimse kendi hesabına bu işlemleri yapamaz.
- Oturum her istekte veritabanından doğrulanır (`getCurrentAdmin`,
  `src/lib/dal.ts`): hesap pasif, davet kabul edilmemiş ya da JWT'deki
  `sessionVersion` veritabanındakinden farklıysa `/admin/cikis` oturumu
  kapatır. Şifre değişince / sıfırlanınca `sessionVersion` artar, tüm
  oturumlar kapanır. Sayfalar `requireView(bölüm)`, işlemler
  `requireEdit(bölüm)` / `requireSuperAdmin()` ile korunur; salt görüntüleme
  arayüzü (`ReadOnlySection`) yalnızca kolaylıktır, asıl engel sunucudadır.
- E-posta bağlantıları ve kodları `auth_tokens` tablosunda yalnızca
  `AUTH_SECRET` ile HMAC özeti olarak tutulur, tek kullanımlıktır:
  şifre sıfırlama 5 dk, şifre değiştirme kodu 5 dk (en fazla 5 deneme,
  60 sn'de bir yeniden gönderme), davet 24 saat. 15 dakikada en fazla 3
  sıfırlama bağlantısı gider. Canlıda bağlantılar sabit
  `https://admin.<NEXT_PUBLIC_SITE_URL alan adı>` ile kurulur (Host
  başlığına güvenilmez); önizleme ve yerelde isteğin adresi kullanılır.
- İşlem kaydı `activity_logs` tablosunda, 365 gün saklanır (ekran
  açılınca eskileri silinir). Kullanıcı silinse de adı kayıtta kalır.
- e2e testlerinde e-posta gönderilmez: `EMAIL_OUTBOX_FILE` tanımlıysa
  (`playwright.config.ts`) e-postalar o dosyaya JSON satırı olarak yazılır.
  `VERCEL_ENV=production` iken bu değişken yok sayılır.
- Paneldeki sunucu işlemleri beklenen hataları fırlatmaz, `{ error }`
  döndürür: üretimde fırlatılan hataların mesajı gizlenir.
- Yedek `pg_dump --format=custom --schema=public` ile alınır. Geri yükleme:
  `pg_restore --no-owner --no-privileges -d "$DATABASE_URL" site-….dump`
  (boş bir veritabanına; "schema public already exists" hatası zararsızdır).
  Dolu bir veritabanına geri yüklemeden önce ilgili tablolar boşaltılmalı;
  Supabase'te `--clean` kullanmayın, public şemasını silmeye çalışır.
- `prisma/seed.ts` her bölümü yalnızca ilgili tablo boşsa çalıştırır:
  diller, admin (hiç admin yoksa), katalog (hiç kategori ve ürün yoksa).
  Panelden girilen veriye dokunmaz.
- Diller: `tr`, `en`, `ru`, `ar` yayında; dil paketi `de`, `fr`, `fa`,
  `az`, `es`, `it` (`src/i18n/routing.ts`, `messages/<kod>.json`) kapalı
  başlar (`20260926100000_language_package` migration'ı, boş veritabanında
  seed). Durum `languages` tablosunda: `isActive` = Yayında,
  `isPreparing` = Hazırlık (yalnızca panel formları ve Eksik Çeviriler;
  `getEditableLanguages`). Yayında olmayan dil ziyaretçiye yoktur: proxy
  `/<kod>/…` adresini `/`'e yönlendirir, next-intl yalnızca yayındaki
  dillerle çalışır (tarayıcı dili tespiti dahil); site haritası, hreflang ve
  `og:locale:alternate` `getLiveLocales()` ile yalnızca yayındakileri
  listeler. Geçerli önizleme çerezi olan panel kullanıcısı bütün dilleri
  görür. Türkçe (`routing.defaultLocale`, çevirilerin kaynağı) sabit ana
  dildir: panelden yayından kaldırılamaz, silinemez, başka bir dil
  varsayılan yapılamaz. Siteye yeni bir arayüz metni eklerken on dilin hepsine yazın
  (anahtar ve `{…}` yer tutucuları aynı olmalı). Listede olmayan bir dil
  için: `routing.ts` + `messages/<kod>.json` + `OG_LOCALES` +
  `translation.ts` dil notu; sağdan sola ise `RTL_LOCALES` ve `:lang()`
  kuralları.
- Arapça ve Farsça sağdan sola yazılır: kök `<html>` `dir` değerini
  `getDirection()` verir; yerleşimde `ms-/me-/start-/end-` gibi mantıksal
  sınıflar kullanın. Bu sayfalarda Arapça yazı tipleri (Reem Kufi, IBM Plex
  Sans Arabic; Farsça harfleri de içerir) öne geçer ve harf aralığı
  sıfırlanır (`globals.css`, `:lang(ar)`, `:lang(fa)`); Latin kalması gereken
  öğeler (logo, @kullanıcıadı) `lang="en"` / `dir="ltr"` taşır ve logo
  `font-logo` kullanır.
- `src/lib/prisma.ts` sunucu örneği başına en fazla 3 bağlantı açar;
  boştaki bağlantı 5 sn'de kapanır ve havuz `attachDatabasePool`
  (`@vercel/functions`) ile bağlanır (proxy'nin havuzu da, `site-gate.ts`).
  Sebep: Supabase "Session pooler" aynı anda en fazla 15 bağlantıya izin
  verir; Vercel (Fluid compute) örneği istekler arasında dondurduğunda
  boştaki bağlantılar açık kalıp sınırı dolduruyordu ("EMAXCONNSESSION max
  clients reached in session mode"). Yine görülürse `DATABASE_URL` için
  Supabase "Transaction pooler" (6543) adresine geçilir; migration'lar için
  ayrı bir oturum adresi gerekir.
- Sunucu fonksiyonları `vercel.json` ile Dublin'de (`dub1`), Supabase
  ile aynı bölgede çalışır.
- Görseller tarayıcıda uzun kenarı 1920 px / WebP'ye küçültülüp
  gönderilir; Server Action gövde sınırı 4 MB'tır (Vercel'in sınırı
  4,5 MB). Sitede `next/image` en fazla 1920 px genişlik üretir
  (`next.config.ts` → `images.deviceSizes`); daha büyük `w` isteği 400 döner.
- Görsel koruması (`src/components/site/image-guard.tsx`, `globals.css`):
  site sayfalarında `img`/`picture` üzerinde sağ tık ve sürükleme
  engellenir; `-webkit-touch-callout: none` iOS'ta uzun basma menüsünü,
  `user-select: none` seçimi kapatır; yazdırmada görseller gizlenir.
  Görsel dışında sağ tık açıktır. Ekran görüntüsünü ve geliştirici
  araçlarını engellemez; amaç kolay kopyalamayı önlemektir.
- Varyant adı ve görsel alt metninin Türkçesi kendi sütunundadır
  (`product_variants.name`, `product_images.altText`); diğer diller
  `product_variant_translations` / `product_image_translations`
  tablolarındadır. Çeviri alan adları `variant_<id>` ve `alt_<id>`
  (`src/lib/translation-rules.ts`); Eksik Çeviriler ve panel ana
  ekranındaki sayaç bunları da sayar. Sitede çevirisi olmayan varyant
  Türkçe adıyla, alt metni olmayan görsel o dilin ürün adıyla görünür.
- Taslak önizleme: `/admin/onizleme?hedef=/tr/urun/<adres>` önizleme
  çerezini bırakıp o sayfaya gider (`safePreviewTarget` yalnızca dil önekli
  site yollarını kabul eder). Yayında olmayan ürün sayfası yalnızca geçerli
  önizleme çereziyle açılır, "Taslak" şeridi ve `noindex` taşır;
  ziyaretçiye 404'tür.
- Kaydederken boş dil uyarısı: `TranslateFieldsButton` formun `submit`
  olayını yakalama aşamasında durdurur (React'in form işlemi çalışmaz);
  "Çevirmeden kaydet" `form.requestSubmit()` ile aynı düğmeyle yeniden
  gönderir. Çeviri ayarlı değilse uyarı çıkmaz.
- WhatsApp: numara `site_settings.whatsappNumber` içinde yalnızca rakam
  olarak durur (ör. `905551234567`; `src/lib/whatsapp.ts` panelde yazılan
  0532…, +90…, 0090… biçimlerini çevirir). Bağlantı
  `https://wa.me/<numara>?text=<ziyaretçinin dilindeki mesaj>`;
  mesajlar `messages/*.json` → `Contact.whatsappMessage`. Aynı numara ana
  sayfanın JSON-LD'sinde `telephone` olarak verilir. Okunamazsa (ör.
  migration'ı henüz uygulanmamış önizleme) bağlantı gizlenir.
- Marka: ad, unvan, logo yazısı, renkler, iletişim bilgileri ve iki
  isteğe bağlı hareket (açılış animasyonu, Yakında perdesi)
  `src/config/brand.ts`'tedir. Renkler kök layout'larda `<html>`'e CSS
  değişkeni olarak konur (`src/lib/brand-theme.ts`); Tailwind'deki
  `brand`, `brand-dark`, `highlight`, `surface`, `ink`, `hairline` renkleri
  bunları okur (`globals.css`). E-postalar, `/og.png` paylaşım görseli ve
  `src/app/icon.tsx` / `apple-icon.tsx` sekme simgeleri aynı ayarı kullanır;
  `/favicon.ico` `/icon`'a yönlenir (`next.config.ts`).
- `messages/*.json` içindeki `{brandName}`, `{legalName}` ve `{courtCity}`
  yer tutucuları yüklenirken ayardaki değerlerle doldurulur
  (`src/i18n/brand-messages.ts`); bunlar ICU argümanı değildir, `t()`'ye
  değer olarak verilmez.
- Yakında perdesi (`features.comingSoonCurtain`) dört görsel ister:
  `public/images/yakinda/{yatay,dikey}-{acik,kapali}.webp` (1672×941 ve
  941×1672). Kumaş bölgesinin koordinatları
  `curtain-stage.module.css`'tedir; görseller değişirse yeniden ölçülür.
- Yerel geliştirme: `docker compose up -d`, `.env.example` → `.env`,
  `pnpm db:migrate:deploy`, `pnpm db:seed`, `pnpm dev`.
