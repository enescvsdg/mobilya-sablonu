/**
 * ─────────────────────────────────────────────────────────────────────
 *  MARKA AYARLARI
 *
 *  Yeni bir müşteri için ilk düzenlenecek dosya. Sitenin adı, logosu,
 *  renkleri, iletişim bilgileri ve yasal unvanı buradan okunur: menü,
 *  alt bilgi, açılış animasyonu, Yakında sayfası, e-postalar, paylaşım
 *  görseli, sekme simgesi, Google'a verilen şirket bilgisi ve yasal
 *  metinler.
 *
 *  Buradaki değerler örnektir. Adım adım kurulum: YENI-MUSTERI.md
 * ─────────────────────────────────────────────────────────────────────
 */
export const brand = {
  /** Görünen ad: sekme başlığı, e-postalar, © satırı, Google'daki şirket adı. */
  name: "Örnek Mobilya",

  /** Resmî unvan: Gizlilik Politikası'nda "veri sorumlusu", Kullanım Şartları'nda taraf. */
  legalName: "Örnek Mobilya Sanayi ve Ticaret Ltd. Şti.",

  /** Kullanım Şartları'nda yetkili mahkemelerin şehri. */
  courtCity: "İstanbul",

  /**
   * Yazı logosu. `primary` büyük yazılır. `secondary` (ör. kuruluş yılı ya
   * da "MOBİLYA") yanında soluk yazılır; istenmezse "" bırakılır. Logo her
   * dilde Latin harflerle ve soldan sağa kalır.
   */
  logo: { primary: "ÖRNEK", secondary: "MOBİLYA" },

  /**
   * Paylaşım görselinin (/og.png) alt satırı; WhatsApp ve sosyal medya
   * önizlemelerinde görünür. Yazıldığı gibi basılır (büyük harfle yazın).
   */
  shareTagline: "EL YAPIMI MOBİLYA",

  /**
   * Otomatik çeviriye (Gemini) verilen kısa tanım, İngilizce: markanın ne
   * yaptığını anlatır, çevirinin üslubunu belirler.
   */
  translationContext: "a Turkish furniture maker that designs and builds handcrafted furniture",

  /** Renkler (#rrggbb). Site, e-postalar, paylaşım görseli ve sekme simgesi bunları kullanır. */
  colors: {
    /** Ana renk: başlıklar, düğmeler, koyu bantlar. */
    brand: "#2e3b36",
    /** Ana rengin koyusu: üst menü, alt koyu zeminler. */
    brandDark: "#232d29",
    /** Vurgu (altın, pirinç vb.): logo, ince çizgiler, üzerine gelince. */
    highlight: "#b89560",
    /** Vurgunun açığı: koyu zemin üstündeki ince yazılar. */
    highlightLight: "#e2d3b5",
    /** Açık zemin. */
    surface: "#f8f6f2",
    /** İkinci açık zemin; koyu zemin üstündeki yazı rengi. */
    surfaceWarm: "#f1ece4",
    /** Metin rengi. */
    ink: "#1d1f1e",
    /** İnce ayraç çizgileri. */
    hairline: "#e3ded5",
  },

  contact: {
    email: "info@example.com",
    instagramHandle: "ornekmobilya",
    instagramUrl: "https://www.instagram.com/ornekmobilya",
    /** Adres çevrilmez; her dilde aynı yazılır. */
    address: {
      street: "Örnek Mahallesi, Mobilyacılar Caddesi No:1",
      locality: "Kadıköy",
      region: "İstanbul",
      /** Google için ülke kodu (ISO 3166-1). */
      countryCode: "TR",
      line: "Örnek Mahallesi, Mobilyacılar Caddesi No:1, Kadıköy, İstanbul, Türkiye",
      /** Harita iğnesi: Google Haritalar'da mağazaya sağ tıklayınca çıkan ilk iki sayı. */
      lat: 40.990283,
      lng: 29.028873,
    },
  },

  features: {
    /** İlk ziyarette logonun ekranın ortasından menüdeki yerine uçtuğu açılış animasyonu. */
    introAnimation: true,
    /**
     * Yakında sayfasında kadife perdenin açıldığı sahne. Açmadan önce
     * public/images/yakinda/ klasörüne dört perde görseli konmalıdır
     * (YENI-MUSTERI.md). Kapalıyken sayfa perdesiz; ışık ve yazı
     * hareketleriyle açılır.
     */
    comingSoonCurtain: false,
  },
} as const;
