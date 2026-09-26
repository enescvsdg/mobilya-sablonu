import Image from "next/image";
import {
  Boxes,
  FileText,
  FolderTree,
  Globe,
  HelpCircle,
  History,
  Image as ImageIcon,
  Inbox,
  Languages,
  Settings,
  Star,
  Theater,
  TriangleAlert,
  UserCog,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { getAdminBaseUrl } from "@/lib/admin-url";

export const metadata = {
  title: "Yardım",
};

const SECTIONS = [
  { id: "baslangic", label: "Başlangıç" },
  { id: "urun-ekleme", label: "Ürün ekleme" },
  { id: "alan-karsiliklari", label: "Hangi alan sitede nereye çıkıyor?" },
  { id: "gorseller", label: "Görseller" },
  { id: "one-cikarma", label: "Öne çıkarma" },
  { id: "kategoriler", label: "Kategoriler" },
  { id: "site-metinleri", label: "Site metinleri" },
  { id: "talepler", label: "Gelen talepler" },
  { id: "diller", label: "Diller" },
  { id: "ceviri", label: "Otomatik çeviri" },
  { id: "hesap", label: "Hesabım ve şifre" },
  { id: "kullanicilar", label: "Kullanıcılar ve roller" },
  { id: "islem-kaydi", label: "İşlem kaydı" },
  { id: "yakinda", label: "Yakında sayfası ve siteyi önizleme" },
  { id: "site-ayarlari", label: "Site Ayarları (WhatsApp)" },
  { id: "dikkat", label: "Dikkat edilecekler" },
];

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-4 overflow-hidden rounded-lg border bg-muted/30">
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        className="h-auto w-full"
        unoptimized
      />
      <figcaption className="border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {alt}
      </figcaption>
    </figure>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed [&_li]:leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

const FIELD_MAP = [
  {
    field: "SKU",
    where: "Sitede hiç görünmez",
    note: "Sadece sizin ürünü takip etmeniz için bir stok kodu. Örn. BF-ARM-003. Her üründe farklı olmak zorunda.",
  },
  {
    field: "Kategori",
    where: "Ürünün hangi koleksiyon sayfasında listeleneceğini belirler",
    note: "Kanepeler seçerseniz ürün Koleksiyonlar → Kanepeler sayfasında çıkar.",
  },
  {
    field: "Genişlik / Yükseklik / Derinlik",
    where: "Ürün sayfasında “Boyutlar” başlığı altında",
    note: "Sadece sayı yazın (örn. 150). “cm” otomatik eklenir. Boş bırakırsanız o başlık hiç görünmez.",
  },
  {
    field: "Sıra numarası",
    where: "Ürünlerin listelenme sırası",
    note: "Küçük sayı önce gelir. Hepsi 0 ise sırayı sistem belirler.",
  },
  {
    field: "Yayında (kutucuk)",
    where: "İşaretli değilse ürün sitede hiç görünmez",
    note: "Hazır olmayan ürünleri işareti kaldırarak taslak olarak bekletebilirsiniz. Taslağı düzenleme ekranındaki “Taslağı sitede önizle” ile yalnızca siz görürsünüz.",
  },
  {
    field: "İsim",
    where: "Ürün kartında ve ürün sayfasının büyük başlığında",
    note: "Zorunlu alan (en az Türkçesi). Boş bırakılan diller Türkçe ismi kullanır; “Türkçeden çevir” ile doldurabilirsiniz.",
  },
  {
    field: "Adres (slug)",
    where: "Tarayıcının adres çubuğunda: /urun/milano-koltuk",
    note: "Boş bırakın — isimden otomatik üretilir. Yayındaki bir ürünün adresini sonradan değiştirmeyin, eski link kırılır.",
  },
  {
    field: "Kısa açıklama",
    where: "Ürün kartında, ismin hemen altındaki ince gri yazı",
    note: "Tek cümle, en fazla 100-120 karakter olsun. Uzun yazarsanız kart dağılır.",
  },
  {
    field: "Açıklama",
    where: "Ürün sayfasında, başlığın altındaki ana metin",
    note: "2-4 cümle ideal. Ürünün hikayesini, tasarım detayını burada anlatın.",
  },
  {
    field: "Malzemeler / el işçiliği notu",
    where: "Ürün sayfasında “Malzemeler” başlığı altında",
    note: "Örn: Kadife döşeme, masif meşe ayak.",
  },
  {
    field: "SEO başlığı",
    where: "Google arama sonucundaki mavi başlık + tarayıcı sekmesi",
    note: `Boş bırakırsanız ürün ismi kullanılır. Sonuna “| ${brand.name}” eklemeyin; site bunu kendisi ekler.`,
  },
  {
    field: "SEO açıklaması",
    where: "Google arama sonucunda başlığın altındaki iki satırlık gri yazı",
    note: "Boş bırakırsanız kısa açıklama kullanılır. 150-160 karakter idealdir.",
  },
];

export default async function AdminHelpPage() {
  const adminHost = new URL(await getAdminBaseUrl()).host;
  // "Ad <adres>" ya da yalnızca adres; ayarlanmamışsa örnek gösterilir.
  const fromSetting = process.env.RESEND_FROM_EMAIL;
  const senderAddress =
    fromSetting?.match(/<([^>]+)>/)?.[1] ?? fromSetting ?? "noreply@alanadiniz.com";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <HelpCircle className="size-6" />
          Yardım — Kullanım Kılavuzu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Panelde ne yapacağınızı ve yaptığınız şeyin sitede tam olarak nereye
          yansıdığını anlatır. Teknik bilgi gerekmez.
        </p>
      </div>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-semibold">İçindekiler</p>
          <ol className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {SECTIONS.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {index + 1}. {section.label}
                </a>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Section id="baslangic" icon={Boxes} title="1. Başlangıç: panel nedir, nasıl girilir">
        <p>
          Bu panel siteyi yöneteceğiniz yerdir. Sitenin kendisinde panele giden
          hiçbir bağlantı yoktur — kimse tesadüfen bulamaz. Panele yalnızca{" "}
          <strong>{adminHost}</strong> adresinden, e-posta ve
          şifrenizle girilir.
        </p>
        <Shot src="/images/kilavuz/01-giris.webp" alt="Giriş ekranı" />
        <p className="mt-4">
          Girince karşınıza <strong>Panel</strong> ekranı gelir: en üstte
          sitenin <strong>Yakında Sayfası</strong> durumu (bkz. 14. bölüm), altında
          kaç ürününüz, kaç kategoriniz ve kaç yeni talebiniz olduğu görünür.
          Kutulara tıklayarak ilgili bölüme geçebilirsiniz. Her kişi yalnızca
          rolünün izin verdiği bölümleri görür (bkz. 12. bölüm).
        </p>
        <Shot src="/images/kilavuz/02-panel.webp" alt="Panel ana ekranı" />
        <p className="mt-4">Sol menüdeki bölümler:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Ürünler</strong> — ürün ekleme,
            düzenleme, görsel yükleme, öne çıkarma
          </li>
          <li>
            <strong className="text-foreground">Kategoriler</strong> —
            koleksiyonlar (Koltuklar, Kanepeler, Sehpalar…) ve kapak görselleri
          </li>
          <li>
            <strong className="text-foreground">Talepler</strong> — siteden
            gelen teklif ve iletişim mesajları
          </li>
          <li>
            <strong className="text-foreground">Site Metinleri</strong> — ana
            sayfa ve Hakkımızda sayfasındaki yazılar ve görseller
          </li>
          <li>
            <strong className="text-foreground">Diller</strong> — sitedeki
            dillerin açılıp kapatılması
          </li>
          <li>
            <strong className="text-foreground">Kullanıcılar, Roller, İşlem Kaydı</strong>{" "}
            — panele kimin girebileceği, ne yapabileceği ve kimin ne yaptığı
            (yalnızca Süper Yönetici görür)
          </li>
          <li>
            <strong className="text-foreground">Hesabım</strong> — kendi
            şifrenizi değiştirme
          </li>
          <li>
            <strong className="text-foreground">Siteyi önizle</strong> — Yakında
            sayfası açıkken gerçek siteyi yeni sekmede açar (bkz. 14. bölüm)
          </li>
        </ul>
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-3">
          <p className="font-semibold">Altın kural: Türkçe zorunlu, diğerleri isteğe bağlı</p>
          <p className="mt-1 text-muted-foreground">
            Her formda dört dil bölümü (Türkçe / English / Русский / العربية)
            vardır. Sadece Türkçeyi doldurmanız yeterlidir — boş bıraktığınız
            dillerde site Türkçe metni gösterir, hiçbir yer boş kalmaz. Diğer
            dilleri sonradan istediğiniz zaman ekleyebilirsiniz. Arapça alanlara
            yazdığınız metin kendiliğinden sağdan sola dizilir.
          </p>
        </div>
      </Section>

      <Section id="urun-ekleme" icon={Boxes} title="2. Yeni ürün ekleme">
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            Sol menüden <strong>Ürünler</strong> → sağ üstteki{" "}
            <strong>+ Yeni Ürün</strong> butonuna tıklayın.
          </Step>
          <Step n={2}>
            <strong>SKU</strong> yazın (kendi stok kodunuz, örn. BF-ARM-003) ve{" "}
            <strong>Kategori</strong> seçin. Bu ikisi zorunludur.
          </Step>
          <Step n={3}>
            Varsa <strong>ölçüleri</strong> girin (sadece sayı, örn. 150).
          </Step>
          <Step n={4}>
            Aşağıdaki <strong>Türkçe</strong> bölümüne en azından{" "}
            <strong>İsim</strong> yazın. Kısa açıklama, açıklama ve malzemeleri
            de doldurmanız önerilir. Sonra <strong>Türkçeden çevir</strong>{" "}
            düğmesiyle diğer dilleri doldurup kontrol edin (bkz.{" "}
            <a href="#ceviri" className="underline">Otomatik çeviri</a>).
          </Step>
          <Step n={5}>
            İsterseniz aynı anda <strong>görsel</strong> seçin, sonra{" "}
            <strong>Ürünü Kaydet</strong>’e basın.
          </Step>
          <Step n={6}>
            Kayıttan sonra otomatik olarak düzenleme ekranına geçersiniz —
            görselleri sıralayabilir, varyant ekleyebilirsiniz. Sağ üstteki{" "}
            <strong>Sitede gör</strong> (ürün yayında değilse{" "}
            <strong>Taslağı sitede önizle</strong>) ürünü sitede yeni sekmede açar.
            Taslak ürün sayfasının üstünde sarı bir “Taslak” uyarısı görünür;
            ziyaretçiler bu sayfayı göremez.
          </Step>
        </ol>
        <Shot src="/images/kilavuz/04-yeni-urun.webp" alt="Yeni ürün formu" />
        <p className="mt-2">
          Kaydettikten sonra ürün <strong>hemen sitede yayınlanır</strong>{" "}
          (“Yayında” kutucuğu işaretliyse). Hazır olmayan ürünler için bu
          kutucuğun işaretini kaldırın, ürün panelde durur ama sitede görünmez.
        </p>
      </Section>

      <Section
        id="alan-karsiliklari"
        icon={FileText}
        title="3. Hangi alan sitede nereye çıkıyor?"
      >
        <p className="mb-4 text-muted-foreground">
          Panelde doldurduğunuz her alanın sitedeki tam karşılığı:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-2 font-semibold">Paneldeki alan</th>
                <th className="p-2 font-semibold">Sitede nerede görünür</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_MAP.map((row) => (
                <tr key={row.field} className="border-b align-top">
                  <td className="p-2 font-medium whitespace-nowrap">{row.field}</td>
                  <td className="p-2">
                    <span>{row.where}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {row.note}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="gorseller" icon={ImageIcon} title="4. Görseller">
        <p>
          Ürünü kaydettikten sonra düzenleme ekranındaki{" "}
          <strong>Görseller</strong> bölümünden dilediğiniz kadar fotoğraf
          yükleyebilirsiniz.
        </p>
        <Shot src="/images/kilavuz/06-urun-gorselleri.webp" alt="Ürün görselleri bölümü" />
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Ana görsel</strong> — yıldız/işaret ile seçtiğiniz görsel,
            ürün kartlarında ve ana sayfada görünen fotoğraftır. Yüklediğiniz
            ilk görsel otomatik olarak ana görsel olur.
          </li>
          <li>
            <strong>Sıralama</strong> — yukarı/aşağı okları ile ürün
            sayfasındaki küçük resimlerin sırasını değiştirirsiniz.
          </li>
          <li>
            <strong>Alt metin</strong> — görseli göremeyen ziyaretçiler ve
            Google Görseller için kısa açıklama. Örn: “Bej keten üç kişilik
            kanepe”. Her görselin altında Türkçe (TR) ve diğer diller için
            birer kutu vardır; kutudan çıkınca kendiliğinden kaydedilir. Bir
            dilin kutusu boşsa o dilde ürünün adı kullanılır. Bölümün üstündeki{" "}
            <strong>Boş dilleri Türkçeden çevir</strong> düğmesi boş kutuları
            çevirip hemen kaydeder.
          </li>
          <li>
            <strong>Dosya kuralları</strong> — JPEG, PNG veya WebP. Telefondan
            çekilen büyük fotoğraflar yüklenmeden önce otomatik küçültülür;
            kare veya dikey fotoğraflar en iyi görünür.
          </li>
          <li>
            <strong>Görsel koruması</strong> — sitede görsellerin üzerinde sağ
            tık menüsü, sürükleyip bırakma, telefonda uzun basma menüsü ve
            yazdırma kapalıdır; görseller en fazla 1920 piksel genişlikte
            gösterilir, asıl büyük dosya dağıtılmaz. Filigran eklenmez. Ekran
            görüntüsü almayı hiçbir site engelleyemez; bu önlemler kopyalamayı
            zorlaştırır.
          </li>
        </ul>
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-3">
          <p className="font-semibold">Varyantlar nedir?</p>
          <p className="mt-1 text-muted-foreground">
            Aynı ürünün kumaş/renk seçenekleridir. “Lacivert Kadife”, “Antrasit
            Keten” gibi bir isim ve renk kodu girersiniz; ürün sayfasında{" "}
            <strong>Seçenekler</strong> başlığı altında küçük renk yuvarlakları
            olarak görünür. Zorunlu değildir, boş bırakabilirsiniz. Varyantın
            adı her dil için ayrı yazılabilir (EN, RU, AR kutuları); boş kalan
            dilde Türkçesi görünür. <strong>Boş dilleri Türkçeden çevir</strong>{" "}
            düğmesi boş kutuları çevirip kaydeder; elle düzelttiğiniz adı
            satırdaki <strong>Kaydet</strong> ile kaydedin.
          </p>
        </div>
      </Section>

      <Section id="one-cikarma" icon={Star} title="5. Bir ürünü öne çıkarma">
        <p>
          Ana sayfadaki <strong>“Öne Çıkan Ürünler”</strong> bölümünde en fazla
          3 ürün gösterilir. Hangilerinin görüneceğini siz seçersiniz:
        </p>
        <ol className="mt-3 flex flex-col gap-3">
          <Step n={1}>
            Sol menüden <strong>Ürünler</strong>’e girin.
          </Step>
          <Step n={2}>
            Öne çıkarmak istediğiniz ürünün satırındaki{" "}
            <strong>yıldız ikonuna</strong> tıklayın (kalem ve çöp kutusu
            ikonlarının solunda).
          </Step>
          <Step n={3}>
            Yıldız <strong>dolu (marka renginde)</strong> olursa ürün öne çıkanlara
            eklenmiştir. Tekrar tıklarsanız çıkarılır.
          </Step>
        </ol>
        <Shot
          src="/images/kilavuz/03-urun-listesi.webp"
          alt="Ürün listesi — dolu yıldızlar öne çıkan ürünleri gösterir"
        />
        <p className="mt-2 text-muted-foreground">
          Üçten fazla ürünü öne çıkarırsanız ana sayfada, ürün listesindeki
          sıraya göre ilk üçü görünür; sığmayan ürünleri panel, listenin
          üstünde sarı bir uyarıyla size söyler. En iyi görünüm için her
          kategoriden bir ürün seçmenizi öneririz.
        </p>
      </Section>

      <Section id="kategoriler" icon={FolderTree} title="6. Kategoriler (koleksiyonlar)">
        <p>
          Kategoriler, sitedeki <strong>Koleksiyonlar</strong> sayfasında kart
          olarak görünür. Her kategorinin bir <strong>kapak görseli</strong>{" "}
          vardır — bu, koleksiyon kartındaki büyük fotoğraftır.
        </p>
        <Shot src="/images/kilavuz/08-kategori-duzenle.webp" alt="Kategori düzenleme ekranı" />
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Kapak görseli</strong> — dikey (portre) fotoğraf kullanın,
            kart 4:5 oranındadır.
          </li>
          <li>
            <strong>Açıklama</strong> — koleksiyon sayfasında başlığın altında
            çıkan tanıtım cümlesi.
          </li>
          <li>
            <strong>Sıra numarası</strong> — koleksiyonların hangi sırayla
            dizileceği.
          </li>
          <li>
            İçinde ürün olan bir kategori <strong>silinemez</strong>. Önce
            ürünleri başka kategoriye taşıyın ya da silin.
          </li>
          <li>
            Bir kategorinin <strong>“Yayında”</strong> işaretini kaldırırsanız
            koleksiyonla birlikte içindeki ürünler de sitede görünmez.
          </li>
        </ul>
      </Section>

      <Section id="site-metinleri" icon={FileText} title="7. Site metinleri">
        <p>
          Ana sayfa ve Hakkımızda sayfasındaki sabit yazıları ve görselleri
          buradan değiştirirsiniz: açılış başlığı, el işçiliği bandı, alıntı
          bandı, Hakkımızda paragrafları.
        </p>
        <Shot src="/images/kilavuz/10-site-metinleri.webp" alt="Site metinleri ekranı" />
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Her bloğun altında o bölümün <strong>ne işe yaradığı</strong>{" "}
            yazılıdır.
          </li>
          <li>
            Bir alanı <strong>boş bırakırsanız</strong> sitedeki hazır metin
            kullanılmaya devam eder — yani hiçbir yer boş kalmaz, bozulmaz.
          </li>
          <li>
            Uzun metinlerde <strong>boş satır bırakarak</strong> paragraf
            ayırabilirsiniz.
          </li>
        </ul>
      </Section>

      <Section id="talepler" icon={Inbox} title="8. Gelen talepler">
        <p>
          Ziyaretçi iletişim formunu doldurduğunda ya da bir ürün için “Teklif
          Al” dediğinde, mesaj buraya düşer. Sol menüdeki{" "}
          <strong>Talepler</strong> yazısının yanındaki rakam{" "}
          <strong>okunmamış</strong> talep sayısıdır.
        </p>
        <Shot src="/images/kilavuz/09-talepler.webp" alt="Gelen talepler ekranı" />
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Her talebin yanındaki listeden durumu değiştirebilirsiniz:{" "}
            <strong>Yeni → Görüşüldü → Kapandı</strong>.
          </li>
          <li>
            Ziyaretçi bir ürün sayfasından yazdıysa hangi ürünle ilgilendiği de
            görünür.
          </li>
          <li>
            E-posta bildirimi kurulduğunda, yeni talepler ayrıca posta kutunuza
            da düşer.
          </li>
        </ul>
      </Section>

      <Section id="diller" icon={Languages} title="9. Diller">
        <p>
          Site şu an dört dilde yayındadır: Türkçe, İngilizce, Rusça ve Arapça.
          Bunlara ek olarak altı dil hazır bekler: <strong>Almanca, Fransızca,
          Farsça, Azerbaycan Türkçesi, İspanyolca ve İtalyanca</strong>. Bu
          dillerde menü, düğmeler, iletişim formu, KVKK ve Kullanım Şartları,
          Yakında sayfası ve WhatsApp mesajı hazırdır; siz açana kadar
          ziyaretçi onları hiçbir yerde görmez. Arapça ve Farsça sayfalar sağdan
          sola açılır; logo her dilde aynı kalır.
        </p>
        <Shot src="/images/kilavuz/11-diller.webp" alt="Diller ekranı" />
        <p className="mt-3 font-semibold">Her dilin üç durumu vardır</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Kapalı</strong> — yalnızca bu listede durur; sitede ve
            panel formlarında görünmez.
          </li>
          <li>
            <strong>Hazırlıkta</strong> — sitede yine görünmez, ama ürün,
            kategori ve site metni formlarında o dilin alanları açılır ve
            Eksik Çeviriler onları da listeler. Çevirileri acele etmeden
            hazırlarsınız.
          </li>
          <li>
            <strong>Yayında</strong> — dil menüsünde görünür, Google&apos;a
            bildirilir, tarayıcısı o dilde olan ziyaretçi siteyi o dilde açar.
          </li>
        </ul>
        <p className="mt-4 font-semibold">Yeni bir dili açmak</p>
        <ol className="mt-2 flex flex-col gap-3">
          <Step n={1}>
            <strong>Diller</strong> ekranında dilin satırında{" "}
            <strong>Hazırlığa al</strong>.
          </Step>
          <Step n={2}>
            <strong>Eksik Çeviriler → Tümünü çevir</strong> ile ürünleri,
            kategorileri ve site metinlerini o dile çevirin. Yeni eklediğiniz
            ürünlerde <strong>Türkçeden çevir</strong> düğmesi o dilin
            isim ve açıklama alanlarını da doldurur. Tablodaki{" "}
            <strong>Çevirisi tamam</strong> sütunu kaç ürünün o dile gerçekten
            çevrildiğini gösterir; alanı boş bırakılıp kaydedilen ürünler
            sayılmaz.
          </Step>
          <Step n={3}>
            <strong>Sitede önizle</strong> ile sitenin o dildeki hâline bakın;
            bunu yalnızca siz görürsünüz.
          </Step>
          <Step n={4}>
            Hazır olunca <strong>Yayına al</strong>. Geri almak için{" "}
            <strong>Yayından kaldır</strong>: çeviriler silinmez.
          </Step>
        </ol>
        <p className="mt-3 text-muted-foreground">
          KVKK ve Kullanım Şartları metinleri çeviridir; bir dili yayına
          almadan önce o dili bilen birine okutmanız önerilir. Listede olmayan
          bir dil (ör. Çince) yazılım gerektirir. Türkçe sitenin ana dilidir
          (Varsayılan): yayından kaldırılamaz ve silinemez, çünkü bütün
          çevirilerin kaynağı ve diğer dillerin yedeği odur.
        </p>
      </Section>

      <Section id="ceviri" icon={Globe} title="10. Otomatik çeviri">
        <p>
          Açıklamaları dört dile tek tek çevirmeniz gerekmez: Türkçesini
          yazarsınız, İngilizce, Rusça ve Arapça alanlarını Google&apos;ın
          yapay zekâsı (Gemini) doldurur.
        </p>
        <p className="mt-4 font-semibold">Formlarda: “Türkçeden çevir”</p>
        <ol className="mt-2 flex flex-col gap-3">
          <Step n={1}>
            Ürün, kategori ya da site metni formunda <strong>Türkçe</strong>{" "}
            alanları doldurun.
          </Step>
          <Step n={2}>
            <strong>Türkçeden çevir</strong> düğmesine basın. Boş dil alanları
            birkaç saniye içinde dolar ve <strong>sarı çerçeveyle</strong>{" "}
            işaretlenir.
          </Step>
          <Step n={3}>
            Çevirileri okuyun, gerekirse düzeltin ve formu her zamanki gibi{" "}
            <strong>kaydedin</strong>. Kaydetmezseniz hiçbir şey değişmez.
          </Step>
        </ol>
        <p className="mt-3 text-muted-foreground">
          Bazı dil alanları zaten doluysa düğme önce sorar:{" "}
          <strong>Yalnız boş alanları doldur</strong>,{" "}
          <strong>Dolu alanların da üzerine yaz</strong> ya da{" "}
          <strong>Vazgeç</strong>. Türkçe ismin aynısı yazılmış isim alanları
          boş sayılır.
        </p>
        <p className="mt-3">
          Türkçesi yazılı ama başka bir dilde boş alan varken kaydetmek
          isterseniz panel sorar: <strong>Önce çevir</strong> boş alanları
          doldurur (sonra kontrol edip yeniden kaydedersiniz),{" "}
          <strong>Çevirmeden kaydet</strong> formu olduğu gibi kaydeder.
        </p>
        <p className="mt-4 font-semibold">Menüde: “Eksik Çeviriler”</p>
        <p className="mt-2">
          Türkçesi yazılmış ama başka bir dilde boş kalan alanları listeler
          (ürünler — varyant adları ve görsel alt metinleri dahil —,
          kategoriler, site metinleri). Kaç kaydın eksik olduğu panel ana
          ekranındaki <strong>Eksik Çeviriler</strong> kutusunda da görünür.
          Satırdaki{" "}
          <strong>Çevir</strong> ya da üstteki <strong>Tümünü çevir</strong>{" "}
          bu alanları çevirip <strong>hemen kaydeder</strong>; dolu alanlara
          dokunmaz. Çevrilen kayıtları <strong>Kontrol et</strong> ile açıp
          gözden geçirin.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Marka ve model adları çevrilmez: “Milano Koltuk” İngilizcede
            “Milano Armchair” olur; {brand.name} her dilde aynı kalır.
          </li>
          <li>
            Türkçe isimden otomatik üretilmiş adres (slug), çevrilen isimden
            yeniden üretilir (ör. /en/urun/milano-armchair). Elle
            yazdığınız adreslere dokunulmaz.
          </li>
          <li>
            Google&apos;ın <strong>ücretsiz</strong> katmanı kullanılır; ek ücret
            çıkmaz. Günlük ve dakikalık bir sınırı vardır. “Ücretsiz çeviri
            sınırı doldu” derse bir dakika sonra tekrar deneyin; yine olmazsa
            ertesi gün sınır sıfırlanır.
          </li>
          <li>
            “Otomatik çeviri henüz ayarlanmadı” yazıyorsa Vercel&apos;e{" "}
            <strong>GEMINI_API_KEY</strong> eklenmemiştir (DEPLOYMENT.md,
            “Otomatik çeviri” bölümü).
          </li>
        </ul>
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-3">
          <p className="font-semibold">Makine çevirisidir</p>
          <p className="mt-1 text-muted-foreground">
            Çeviriler genelde iyidir ama bir çevirmen kadar güvenilir değildir.
            Özellikle Arapça ve Rusça metinleri, mağaza açılmadan önce o dili
            bilen birine bir kez okutmanızı öneririz.
          </p>
        </div>
      </Section>

      <Section id="hesap" icon={UserCog} title="11. Hesabım ve şifre">
        <p>
          Şifrenizi <strong>Hesabım</strong> ekranından değiştirirsiniz: mevcut
          şifrenizi bir kez, yeni şifrenizi (en az 10 karakter) iki kez
          yazıp <strong>Onay kodu gönder</strong> dersiniz. E-postanıza 6 haneli
          bir kod gelir; kodu yazıp <strong>Onayla ve şifreyi değiştir</strong>{" "}
          dediğinizde yeni şifre geçerli olur. Kod 5 dakika geçerlidir; gelmezse
          bir dakika sonra <strong>Kodu yeniden gönder</strong> ile yenisini
          isteyebilirsiniz.
        </p>
        <Shot src="/images/kilavuz/12-hesabim.webp" alt="Hesabım: şifre değiştirme ve e-postaya gelen onay kodu" />
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Göz simgesi:</strong> Şifre
            kutularının sağındaki göz simgesine tıklayınca yazdığınız şifre
            görünür; tekrar tıklayınca gizlenir.
          </li>
          <li>
            <strong className="text-foreground">Şifremi unuttum:</strong> Giriş
            ekranındaki bu bağlantıya tıklayıp e-posta adresinizi yazın. Gelen
            e-postadaki bağlantıyla yeni şifrenizi belirlersiniz. Bağlantı 5
            dakika geçerlidir ve yalnızca bir kez kullanılabilir. Güvenlik için
            ekranda adresin kayıtlı olup olmadığı söylenmez.
          </li>
          <li>
            <strong className="text-foreground">Şifre değişince</strong> tüm
            cihazlardaki oturumlar kapanır (bu cihaz dahil); yeni şifrenizle
            yeniden girersiniz. Şifreniz değişince size bilgi e-postası gelir —
            bu değişikliği siz yapmadıysanız hemen Süper Yöneticiye haber verin.
          </li>
          <li>
            <strong className="text-foreground">E-posta adresinizi</strong>{" "}
            kendiniz değiştiremezsiniz.
          </li>
          <li>
            Güvenlik için şifre 5 kez yanlış girilirse giriş 15 dakika
            kilitlenir; süre dolunca tekrar deneyebilirsiniz.
          </li>
        </ul>
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-3">
          <p className="font-semibold">E-postalar nereden gelir?</p>
          <p className="mt-1 text-muted-foreground">
            Onay kodu, şifre sıfırlama ve davet e-postaları
            {senderAddress} adresinden gelir. Gelen kutusunda
            göremezseniz İstenmeyen (Spam) klasörüne bakın ve “Spam değil”
            olarak işaretleyin.
          </p>
        </div>
      </Section>

      <Section id="kullanicilar" icon={Users} title="12. Kullanıcılar ve roller">
        <p>
          Çalışanlarınıza panelde ayrı hesap açabilir, her birinin neyi
          görüp neyi değiştirebileceğini belirleyebilirsiniz. Bu bölümleri
          yalnızca <strong>Süper Yönetici</strong> görür.
        </p>

        <p className="mt-4 font-semibold">Roller</p>
        <p className="mt-1">
          Rol, bir grup yetkidir. <strong>Roller → Yeni Rol</strong> ile bir ad
          verip her bölüm (Ürünler, Kategoriler, Talepler, Site Metinleri,
          Diller) için üç seçenekten birini işaretlersiniz:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Yok</strong> — bölüm menüde
            görünmez, adresi yazılsa da açılmaz
          </li>
          <li>
            <strong className="text-foreground">Görüntüle</strong> — bölümü
            görür ama hiçbir şeyi değiştiremez (düğmeler kapalıdır)
          </li>
          <li>
            <strong className="text-foreground">Düzenle</strong> — ekler,
            değiştirir, siler
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Hazır iki rol vardır: <strong className="text-foreground">Editör</strong>{" "}
          (ürün, kategori ve metinleri düzenler) ve{" "}
          <strong className="text-foreground">Satış</strong> (talepleri
          yönetir, ürünleri ve kategorileri görür). İstediğiniz kadar rol ekleyip
          değiştirebilirsiniz; değişiklik o roldeki herkese hemen yansır.
          İçinde kullanıcı olan rol silinemez (pasif kullanıcılar da sayılır).
          Önce o kişileri <strong className="text-foreground">Kullanıcılar → Düzenle</strong>{" "}
          ile başka bir role geçirin ya da silin.
        </p>
        <Shot src="/images/kilavuz/14-rol.webp" alt="Rol düzenleme: her bölüm için Yok / Görüntüle / Düzenle" />

        <p className="mt-4 font-semibold">Kullanıcı davet etme</p>
        <ol className="mt-2 space-y-2">
          <Step n={1}>
            <strong>Kullanıcılar</strong> ekranında kişinin adını, e-posta
            adresini ve rolünü yazıp <strong>Davet gönder</strong> deyin.
          </Step>
          <Step n={2}>
            Kişiye bir e-posta gider; içindeki bağlantıyla kendi şifresini
            belirleyip hesabını açar. Şifresini siz bilmezsiniz.
          </Step>
          <Step n={3}>
            Davet 24 saat geçerlidir. Süresi dolarsa ya da e-posta gelmediyse
            satırdaki <strong>Daveti yeniden gönder</strong> (kağıt uçak)
            simgesine tıklayın. Adres yanlış yazıldıysa, kişi daveti kabul
            etmeden önce <strong>Düzenle</strong> ile düzeltebilirsiniz; davet
            yeni adrese yeniden gider.
          </Step>
        </ol>
        <Shot src="/images/kilavuz/13-kullanicilar.webp" alt="Kullanıcılar ekranı: davet formu ve kullanıcı listesi" />

        <p className="mt-4 font-semibold">Kullanıcıyı değiştirme, pasif yapma, silme</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Düzenle</strong> (kalem) ile
            adını ve rolünü değiştirirsiniz. Süper Yönetici de rol olarak
            seçilebilir; birden fazla Süper Yönetici olabilir.
          </li>
          <li>
            <strong className="text-foreground">Pasif yap</strong> ile kişi
            panele giremez; açık oturumu da hemen kapanır. Hesap ve geçmişi
            durur; istediğinizde yeniden aktif yaparsınız. İşten ayrılan biri
            için önce bunu kullanın.
          </li>
          <li>
            <strong className="text-foreground">Sil</strong> hesabı tamamen
            kaldırır; işlem kaydındaki adı korunur.
          </li>
          <li>
            Kendi hesabınızı silemez, pasif yapamaz ve rolünü değiştiremezsiniz.
            Son Süper Yönetici de silinemez, pasif yapılamaz — panel sahipsiz
            kalmasın diye.
          </li>
        </ul>
      </Section>

      <Section id="islem-kaydi" icon={History} title="13. İşlem kaydı">
        <p>
          Panelde kimin, ne zaman, ne yaptığı burada listelenir: girişler,
          ürün / kategori / metin değişiklikleri, talep durumları, şifre
          değişiklikleri, kullanıcı ve rol işlemleri, Yakında sayfasının açılıp
          kapanması. Üstteki isimlere tıklayarak tek bir kişinin işlemlerini
          görebilirsiniz. Kayıtlar 1 yıl saklanır, sonra kendiliğinden silinir.
          Bu ekranı yalnızca Süper Yönetici görür.
        </p>
        <Shot src="/images/kilavuz/15-islem-kaydi.webp" alt="İşlem kaydı ekranı" />
      </Section>

      <Section id="yakinda" icon={Theater} title="14. Yakında sayfası ve siteyi önizleme">
        <p>
          Mağaza açılana kadar ziyaretçiler sitenin yerine bir{" "}
          <strong>Yakında</strong> sayfası görür: ışıklar yanar, “Çok Yakında” ve
          logo belirir; altta Instagram ve WhatsApp bağlantıları vardır. Sayfa
          ziyaretçinin diline göre Türkçe, İngilizce, Rusça ya da Arapça açılır. Sitenin
          diğer tüm adresleri bu sayfaya döner; Google da yalnızca bu sayfayı
          görür.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Açıp kapatma:</strong> Panel ana
            ekranındaki <strong className="text-foreground">Yakında Sayfası</strong>{" "}
            kutusundan. “Mağazayı aç” dediğinizde site herkese açılır, “Yakında
            sayfasını aç” ile yeniden kapanır. Değişiklik birkaç saniye içinde
            yansır. Bu düğmeyi yalnızca Süper Yönetici görür.
          </li>
          <li>
            <strong className="text-foreground">Siteyi önizle:</strong> Yakında
            sayfası açıkken gerçek siteyi yalnızca siz görürsünüz. Sol menüdeki
            ya da ana ekrandaki <strong className="text-foreground">Siteyi önizle</strong>{" "}
            bağlantısı siteyi yeni sekmede açar; sol altta “Önizleme modu” yazan
            küçük bir rozet çıkar. Ziyaretçiler bu sırada yine Yakında sayfasını
            görür. Önizleme o tarayıcıda 7 gün geçerlidir; rozetteki{" "}
            <strong className="text-foreground">Çık</strong> ile hemen
            kapatabilirsiniz.
          </li>
          <li>
            <strong className="text-foreground">Yakında sayfasını gör:</strong>{" "}
            Ziyaretçinin ne gördüğünü kontrol etmek için ana ekrandaki bu
            bağlantıyı kullanın.
          </li>
        </ul>
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-3">
          <p className="font-semibold">Mağazayı açmadan önce</p>
          <p className="mt-1 text-muted-foreground">
            Ürünleri, kategorileri ve metinleri önizlemeden kontrol edin; demo
            ürünleri silin; adres, telefon ve KVKK bilgilerinin gerçek olduğundan
            emin olun.
          </p>
        </div>
      </Section>

      <Section id="site-ayarlari" icon={Settings} title="15. Site Ayarları (WhatsApp)">
        <p>
          Sitedeki <strong>İletişim</strong> sayfasında, “Bize Ulaşın” bölümünde
          e-posta adresinin altında bir <strong>WhatsApp</strong> bağlantısı
          vardır (Yakında sayfasında da Instagram&apos;ın altında). Ziyaretçi
          tıklayınca WhatsApp açılır ve kendi dilinde hazır bir mesaj yazılı
          gelir; örneğin Türkçede “Merhaba, bilgi alabilir miyim?”. Göndermek
          için yalnızca gönder tuşuna basar.
        </p>
        <ol className="mt-3 flex flex-col gap-3">
          <Step n={1}>
            Sol menüden <strong>Site Ayarları</strong>’nı açın (yalnızca Süper
            Yönetici görür).
          </Step>
          <Step n={2}>
            Numarayı alışık olduğunuz gibi yazın: “0555 123 45 67” ya da ülke
            koduyla “+90 555 123 45 67”. Panel onu WhatsApp&apos;ın istediği
            biçime kendisi çevirir.
          </Step>
          <Step n={3}>
            <strong>Kaydet</strong>’e basın, sonra altta çıkan{" "}
            <strong>WhatsApp&apos;ta dene</strong> bağlantısıyla doğru sohbetin
            açıldığını kontrol edin.
          </Step>
        </ol>
        <p className="mt-3 text-muted-foreground">
          Kutuyu boşaltıp kaydederseniz WhatsApp bağlantısı sitede hiç
          görünmez. Bu numara Google&apos;a mağazanın telefonu olarak da
          bildirilir.
        </p>
      </Section>

      <Section id="dikkat" icon={TriangleAlert} title="16. Dikkat edilecekler">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Silme işlemi geri alınamaz.</strong> Bir ürünü sildiğinizde
            görselleri ve tüm çevirileri de silinir. Emin değilseniz silmek
            yerine “Yayında” işaretini kaldırın.
          </li>
          <li>
            <strong>Yayındaki bir ürünün adresini (slug) değiştirmeyin.</strong>{" "}
            Daha önce paylaşılmış linkler çalışmaz hale gelir.
          </li>
          <li>
            <strong>Değişiklikler anında yayınlanır.</strong> Kaydet dediğiniz
            anda site güncellenir; ayrıca bir “yayınla” adımı yoktur.
          </li>
          <li>
            <strong>Tek seferde çok sayıda fotoğraf seçmeyin.</strong> Büyük
            fotoğraflar otomatik küçültülür, ama bir yüklemede toplam boyut
            sınırlıdır; uyarı görürseniz fotoğrafları birkaç seferde yükleyin.
          </li>
          <li>
            <strong>Sitede fiyat gösterilmez.</strong> Ziyaretçiler fiyat için
            “Teklif Al” butonuyla size ulaşır; panelde fiyat girilecek bir alan
            bilinçli olarak yoktur.
          </li>
          <li>
            <strong>Herkes kendi hesabıyla girsin.</strong> Şifrenizi
            çalışanlarla paylaşmak yerine onları Kullanıcılar ekranından davet
            edin; böylece kimin ne yaptığı İşlem Kaydı&apos;nda görünür ve biri
            ayrıldığında yalnızca onun hesabını kapatırsınız.
          </li>
          <li>
            <strong>Panelin adresini paylaşmayın.</strong> Panel yalnızca
            {adminHost} üzerinden erişilebilir ve arama
            motorlarına kapalıdır.
          </li>
        </ul>
      </Section>
    </div>
  );
}
