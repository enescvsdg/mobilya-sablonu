import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * İlk kurulum verisi.
 *
 * Her bölüm yalnızca ilgili tablo boşsa çalışır; yani bu betik canlı
 * sitede her yayında güvenle yeniden çalıştırılabilir — panelden girilen
 * ya da değiştirilen hiçbir kayda dokunmaz.
 */
async function main() {
  await seedLanguages();
  await seedAdmin();
  await seedCatalog();
}

/** Aynı liste 20260926100000_language_package migration'ında da var. */
const PACKAGE_LANGUAGES = [
  { code: "de", name: "Almanca", nativeName: "Deutsch" },
  { code: "fr", name: "Fransızca", nativeName: "Français" },
  { code: "fa", name: "Farsça", nativeName: "فارسی" },
  { code: "az", name: "Azerbaycan Türkçesi", nativeName: "Azərbaycanca" },
  { code: "es", name: "İspanyolca", nativeName: "Español" },
  { code: "it", name: "İtalyanca", nativeName: "Italiano" },
];

async function seedLanguages() {
  if ((await prisma.language.count()) > 0) {
    console.log("Diller zaten var — atlandı.");
    return;
  }

  await prisma.language.createMany({
    data: [
      { code: "tr", name: "Türkçe", nativeName: "Türkçe", isDefault: true, sortOrder: 0 },
      { code: "en", name: "English", nativeName: "English", isDefault: false, sortOrder: 1 },
      { code: "ru", name: "Русский", nativeName: "Русский", isDefault: false, sortOrder: 2 },
      { code: "ar", name: "Arapça", nativeName: "العربية", isDefault: false, sortOrder: 3 },
      // Dil paketi: arayüz çevirileri hazır, panelden açılana kadar kapalı.
      ...PACKAGE_LANGUAGES.map((language, index) => ({
        ...language,
        isActive: false,
        isDefault: false,
        sortOrder: 4 + index,
      })),
    ],
  });
  console.log(`${4 + PACKAGE_LANGUAGES.length} dil eklendi.`);
}

async function seedAdmin() {
  if ((await prisma.adminUser.count()) > 0) {
    console.log("Admin kullanıcısı zaten var — atlandı.");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD tanımlı değil — admin kullanıcısı eklenmedi.");
    return;
  }

  await prisma.adminUser.create({
    data: {
      email: adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
      name: "Yönetici",
      role: "SUPER_ADMIN",
      activatedAt: new Date(),
    },
  });
  console.log(`Admin kullanıcısı eklendi: ${adminEmail}`);
}

type Translations<T> = Record<"tr" | "en" | "ru" | "ar", T>;

const demoCategories: {
  key: "koltuklar" | "kanepeler" | "sehpalar";
  translations: Translations<{ name: string; slug: string; description: string }>;
}[] = [
  {
    key: "koltuklar",
    translations: {
      tr: {
        name: "Koltuklar",
        slug: "koltuklar",
        description:
          "Kadife, keten ve yün döşemelerle atölyemizde tek tek şekillenen tekli koltuklar.",
      },
      en: {
        name: "Armchairs",
        slug: "armchairs",
        description:
          "Armchairs shaped one by one in our workshop, in velvet, linen and wool upholstery.",
      },
      ru: {
        name: "Кресла",
        slug: "kresla",
        description:
          "Кресла, которые мы изготавливаем вручную: обивка из бархата, льна и шерсти.",
      },
      ar: {
        name: "الكراسي بذراعين",
        slug: "armchairs",
        description:
          "كراسٍ بذراعين نصنعها في مشغلنا قطعةً قطعة، بتنجيد من المخمل والكتان والصوف.",
      },
    },
  },
  {
    key: "kanepeler",
    translations: {
      tr: {
        name: "Kanepeler",
        slug: "kanepeler",
        description:
          "Oturma odasının merkezine yerleşen, el işçiliği iki ve üç kişilik kanepeler.",
      },
      en: {
        name: "Sofas",
        slug: "sofas",
        description: "Handcrafted two- and three-seat sofas made to anchor the living room.",
      },
      ru: {
        name: "Диваны",
        slug: "divany",
        description: "Двух- и трёхместные диваны ручной работы — центр любой гостиной.",
      },
      ar: {
        name: "الأرائك",
        slug: "sofas",
        description: "أرائك لشخصين ولثلاثة أشخاص مصنوعة يدويًا لتكون محور غرفة المعيشة.",
      },
    },
  },
  {
    key: "sehpalar",
    translations: {
      tr: {
        name: "Sehpalar",
        slug: "sehpalar",
        description: "Masif ahşap ve metalin buluştuğu orta sehpalar ve konsollar.",
      },
      en: {
        name: "Coffee Tables",
        slug: "coffee-tables",
        description: "Coffee tables and consoles where solid wood meets metal.",
      },
      ru: {
        name: "Столики",
        slug: "stoliki",
        description: "Журнальные столики и консоли из массива дерева и металла.",
      },
      ar: {
        name: "الطاولات",
        slug: "coffee-tables",
        description: "طاولات قهوة وطاولات كونسول يلتقي فيها الخشب الصلب بالمعدن.",
      },
    },
  },
];

const demoProducts = [
  {
    sku: "ARM-001",
    categorySlug: "koltuklar" as const,
    widthCm: "92",
    heightCm: "80",
    depthCm: "88",
    isFeatured: true,
    imageUrl: "/images/products/milano-koltuk.webp",
    translations: {
      tr: {
        name: "Milano Koltuk",
        slug: "milano-koltuk",
        shortDescription: "El işçiliği kadife koltuk, meşe ayaklı.",
        description:
          "Milano Koltuk, klasik düğmeli kapitone sırtı sade bir gövdeyle buluşturur. Yumuşak kadife döşeme ve masif meşe ayaklar, parçaya hem sıcak hem sağlam bir duruş verir. Her koltuk atölyemizde tek tek döşenir.",
        materialsText: "Kadife döşeme, masif meşe ayak",
        seoTitle: "Milano Koltuk",
        seoDescription: "El işçiliği kadife Milano koltuk. Düğmeli kapitone sırt, masif meşe ayaklar.",
      },
      en: {
        name: "Milano Armchair",
        slug: "milano-armchair",
        shortDescription: "Handcrafted velvet armchair on oak legs.",
        description:
          "The Milano Armchair pairs a classic button-tufted back with a clean, simple body. Soft velvet upholstery and solid oak legs give the piece a warm yet grounded stance. Each armchair is upholstered individually in our workshop.",
        materialsText: "Velvet upholstery, solid oak legs",
        seoTitle: "Milano Armchair",
        seoDescription:
          "Handcrafted velvet Milano armchair with a button-tufted back and solid oak legs.",
      },
      ru: {
        name: "Кресло Milano",
        slug: "kreslo-milano",
        shortDescription: "Кресло ручной работы из бархата на дубовых ножках.",
        description:
          "Кресло Milano сочетает классическую каретную стяжку спинки с простым, чистым силуэтом. Мягкая бархатная обивка и ножки из массива дуба придают изделию тёплый и устойчивый вид. Каждое кресло обивается вручную в нашей мастерской.",
        materialsText: "Бархатная обивка, ножки из массива дуба",
        seoTitle: "Кресло Milano",
        seoDescription:
          "Бархатное кресло Milano ручной работы с каретной стяжкой и ножками из массива дуба.",
      },
      ar: {
        name: "كرسي Milano",
        slug: "milano-armchair",
        shortDescription: "كرسي بذراعين من المخمل مصنوع يدويًا بأرجل من خشب البلوط.",
        description:
          "يجمع كرسي Milano بين الظهر الكلاسيكي المُنجَّد بالأزرار وهيكل بسيط نظيف الخطوط. ويمنح التنجيد المخملي الناعم وأرجل خشب البلوط الصلب القطعة حضورًا دافئًا وثابتًا. يُنجَّد كل كرسي على حدة في مشغلنا.",
        materialsText: "تنجيد من المخمل، أرجل من خشب البلوط الصلب",
        seoTitle: "كرسي Milano",
        seoDescription:
          "كرسي Milano من المخمل مصنوع يدويًا، بظهر مُنجَّد بالأزرار وأرجل من خشب البلوط الصلب.",
      },
    },
  },
  {
    sku: "SOF-001",
    categorySlug: "kanepeler" as const,
    widthCm: "150",
    heightCm: "78",
    depthCm: "85",
    imageUrl: "/images/products/oslo-kanepe.webp",
    translations: {
      tr: {
        name: "Oslo Kanepe",
        slug: "oslo-kanepe",
        shortDescription: "Keten döşemeli, iki kişilik sade kanepe.",
        description:
          "Oslo Kanepe, yumuşak hatları ve alçak profiliyle küçük salonlara ferahlık getirir. Doğal keten döşeme ve ince meşe ayaklar, günlük kullanıma dayanıklı, sakin bir görünüm sunar.",
        materialsText: "Keten döşeme, meşe ahşap ayak",
        seoTitle: "Oslo Kanepe",
        seoDescription:
          "El işçiliği keten döşemeli iki kişilik Oslo kanepe. Meşe ayaklar, sade tasarım.",
      },
      en: {
        name: "Oslo Loveseat",
        slug: "oslo-loveseat",
        shortDescription: "A simple two-seat sofa in linen upholstery.",
        description:
          "With its soft lines and low profile, the Oslo Loveseat brings a sense of space to smaller living rooms. Natural linen upholstery and slender oak legs offer a calm look made for everyday use.",
        materialsText: "Linen upholstery, oak wood legs",
        seoTitle: "Oslo Loveseat",
        seoDescription:
          "Handcrafted two-seat Oslo loveseat in linen upholstery with oak legs. Simple, calm design.",
      },
      ru: {
        name: "Диван Oslo (2-местный)",
        slug: "divan-oslo",
        shortDescription: "Лаконичный двухместный диван с льняной обивкой.",
        description:
          "Мягкие линии и низкий силуэт дивана Oslo добавляют простора небольшим гостиным. Натуральная льняная обивка и тонкие дубовые ножки создают спокойный облик для повседневной жизни.",
        materialsText: "Льняная обивка, ножки из дуба",
        seoTitle: "Диван Oslo",
        seoDescription:
          "Двухместный диван Oslo ручной работы с льняной обивкой и дубовыми ножками.",
      },
      ar: {
        name: "أريكة Oslo لشخصين",
        slug: "oslo-loveseat",
        shortDescription: "أريكة بسيطة لشخصين بتنجيد من الكتان.",
        description:
          "تضفي أريكة Oslo بخطوطها الناعمة وارتفاعها المنخفض إحساسًا بالرحابة على غرف المعيشة الصغيرة. ويمنحها تنجيد الكتان الطبيعي وأرجل البلوط الرفيعة مظهرًا هادئًا يناسب الاستخدام اليومي.",
        materialsText: "تنجيد من الكتان، أرجل من خشب البلوط",
        seoTitle: "أريكة Oslo لشخصين",
        seoDescription:
          "أريكة Oslo لشخصين مصنوعة يدويًا بتنجيد من الكتان وأرجل من خشب البلوط.",
      },
    },
  },
  {
    sku: "SOF-002",
    categorySlug: "kanepeler" as const,
    widthCm: "215",
    heightCm: "80",
    depthCm: "90",
    isFeatured: true,
    imageUrl: "/images/products/verona-kanepe.webp",
    translations: {
      tr: {
        name: "Verona Kanepe",
        slug: "verona-kanepe",
        shortDescription: "Bukle kumaşlı, üç kişilik geniş kanepe.",
        description:
          "Verona Kanepe, derin oturumu ve yuvarlatılmış kolçaklarıyla oturma odasının merkezine yerleşir. Dokulu bukle kumaş, ceviz kaideyle birleşerek hem modern hem sıcak bir etki yaratır. El işçiliğiyle, siparişe göre üretilir.",
        materialsText: "Bukle kumaş döşeme, ceviz ahşap kaide",
        seoTitle: "Verona Kanepe",
        seoDescription: "Üç kişilik, bukle kumaşlı Verona kanepe. Ceviz kaide, el işçiliği.",
      },
      en: {
        name: "Verona Sofa",
        slug: "verona-sofa",
        shortDescription: "A generous three-seat sofa in bouclé fabric.",
        description:
          "With its deep seat and rounded arms, the Verona Sofa anchors the living room. Textured bouclé fabric meets a walnut base for a look that is both modern and warm. Handcrafted and made to order.",
        materialsText: "Bouclé fabric upholstery, walnut wood base",
        seoTitle: "Verona Sofa",
        seoDescription:
          "Three-seat Verona sofa in bouclé fabric on a walnut base. Handcrafted and made to order.",
      },
      ru: {
        name: "Диван Verona (3-местный)",
        slug: "divan-verona",
        shortDescription: "Просторный трёхместный диван из ткани букле.",
        description:
          "Глубокая посадка и округлые подлокотники делают диван Verona центром гостиной. Фактурная ткань букле в сочетании с ореховым основанием создаёт современный и тёплый образ. Изготавливается вручную под заказ.",
        materialsText: "Обивка из ткани букле, основание из ореха",
        seoTitle: "Диван Verona",
        seoDescription:
          "Трёхместный диван Verona из ткани букле на ореховом основании. Ручная работа под заказ.",
      },
      ar: {
        name: "أريكة Verona لثلاثة أشخاص",
        slug: "verona-sofa",
        shortDescription: "أريكة واسعة لثلاثة أشخاص من قماش البوكليه.",
        description:
          "تتوسط أريكة Verona غرفة المعيشة بمقعدها العميق وذراعيها المستديرتين. ويلتقي قماش البوكليه ذو الملمس المميز بقاعدة من خشب الجوز في مظهر عصري ودافئ في آن واحد. تُصنع يدويًا حسب الطلب.",
        materialsText: "تنجيد من قماش البوكليه، قاعدة من خشب الجوز",
        seoTitle: "أريكة Verona لثلاثة أشخاص",
        seoDescription:
          "أريكة Verona لثلاثة أشخاص من قماش البوكليه بقاعدة من خشب الجوز، مصنوعة يدويًا حسب الطلب.",
      },
    },
  },
  {
    sku: "ARM-002",
    categorySlug: "koltuklar" as const,
    widthCm: "88",
    heightCm: "76",
    depthCm: "82",
    imageUrl: "/images/products/nova-koltuk.webp",
    translations: {
      tr: {
        name: "Nova Koltuk",
        slug: "nova-koltuk",
        shortDescription: "Kavisli gövdeli, yün kumaş dinlenme koltuğu.",
        description:
          "Nova Koltuk, sırtı saran kavisli formuyla okuma köşeleri için tasarlandı. Yün karışımlı kumaş döşeme ve ceviz iskelet, rahatlığı sade bir siluetle buluşturur.",
        materialsText: "Yün karışımlı kumaş döşeme, ceviz ahşap iskelet",
        seoTitle: "Nova Koltuk",
        seoDescription:
          "Kavisli formlu, yün kumaşlı Nova dinlenme koltuğu. Ceviz iskelet, el işçiliği.",
      },
      en: {
        name: "Nova Armchair",
        slug: "nova-armchair",
        shortDescription: "A curved lounge chair in wool-blend fabric.",
        description:
          "With a curved form that wraps around the back, the Nova Armchair was designed for reading corners. Wool-blend upholstery and a walnut frame bring comfort together with a simple silhouette.",
        materialsText: "Wool-blend fabric upholstery, walnut wood frame",
        seoTitle: "Nova Armchair",
        seoDescription: "Curved Nova lounge chair in wool-blend fabric with a walnut frame. Handcrafted.",
      },
      ru: {
        name: "Кресло Nova",
        slug: "kreslo-nova",
        shortDescription: "Кресло для отдыха с изогнутой спинкой и обивкой из шерстяной ткани.",
        description:
          "Изогнутая форма, обнимающая спину, делает кресло Nova идеальным для уголка чтения. Обивка из шерстяной смесовой ткани и каркас из ореха сочетают комфорт с лаконичным силуэтом.",
        materialsText: "Обивка из шерстяной смесовой ткани, каркас из ореха",
        seoTitle: "Кресло Nova",
        seoDescription:
          "Кресло для отдыха Nova с изогнутой спинкой, обивкой из шерстяной ткани и каркасом из ореха.",
      },
      ar: {
        name: "كرسي Nova",
        slug: "nova-armchair",
        shortDescription: "كرسي استرخاء منحني من قماش الصوف المخلوط.",
        description:
          "صُمم كرسي Nova لركن القراءة بشكله المنحني الذي يحتضن الظهر. ويجمع التنجيد من قماش الصوف المخلوط وهيكل خشب الجوز بين الراحة وخطوط بسيطة.",
        materialsText: "تنجيد من قماش الصوف المخلوط، هيكل من خشب الجوز",
        seoTitle: "كرسي Nova",
        seoDescription:
          "كرسي استرخاء Nova منحني من قماش الصوف المخلوط بهيكل من خشب الجوز، مصنوع يدويًا.",
      },
    },
  },
  {
    sku: "TBL-001",
    categorySlug: "sehpalar" as const,
    widthCm: "110",
    heightCm: "43",
    depthCm: "110",
    isFeatured: true,
    imageUrl: "/images/products/luna-sehpa.webp",
    translations: {
      tr: {
        name: "Luna Sehpa",
        slug: "luna-sehpa",
        shortDescription: "Masif meşe tablalı yuvarlak orta sehpa.",
        description:
          "Luna Sehpa, masif meşe tablasını tek parça silindir bir gövde üzerinde taşır. Yumuşatılmış kenarları ve doğal ahşap dokusu, oturma grubuna sakin bir merkez oluşturur.",
        materialsText: "Masif meşe tabla ve gövde, doğal yağ cilası",
        seoTitle: "Luna Sehpa",
        seoDescription: "Masif meşe yuvarlak Luna orta sehpa. Doğal yağ cilası, el işçiliği.",
      },
      en: {
        name: "Luna Coffee Table",
        slug: "luna-coffee-table",
        shortDescription: "A round coffee table with a solid oak top.",
        description:
          "The Luna Coffee Table carries its solid oak top on a single cylindrical base. Softened edges and the natural grain of the wood create a calm centre for the seating area.",
        materialsText: "Solid oak top and base, natural oil finish",
        seoTitle: "Luna Coffee Table",
        seoDescription: "Round Luna coffee table in solid oak with a natural oil finish. Handcrafted.",
      },
      ru: {
        name: "Журнальный столик Luna",
        slug: "stolik-luna",
        shortDescription: "Круглый журнальный столик со столешницей из массива дуба.",
        description:
          "Столешница из массива дуба столика Luna покоится на цельном цилиндрическом основании. Смягчённые кромки и природная текстура дерева создают спокойный центр зоны отдыха.",
        materialsText: "Столешница и основание из массива дуба, натуральное масло",
        seoTitle: "Столик Luna",
        seoDescription:
          "Круглый журнальный столик Luna из массива дуба с покрытием натуральным маслом. Ручная работа.",
      },
      ar: {
        name: "طاولة قهوة Luna",
        slug: "luna-coffee-table",
        shortDescription: "طاولة قهوة مستديرة بسطح من خشب البلوط الصلب.",
        description:
          "تحمل طاولة Luna سطحها من خشب البلوط الصلب على قاعدة أسطوانية واحدة. وتصنع حوافها الناعمة وعروق الخشب الطبيعية مركزًا هادئًا لركن الجلوس.",
        materialsText: "سطح وقاعدة من خشب البلوط الصلب، تشطيب بالزيت الطبيعي",
        seoTitle: "طاولة قهوة Luna",
        seoDescription:
          "طاولة قهوة Luna مستديرة من خشب البلوط الصلب بتشطيب زيتي طبيعي، مصنوعة يدويًا.",
      },
    },
  },
  {
    sku: "TBL-002",
    categorySlug: "sehpalar" as const,
    widthCm: "150",
    heightCm: "78",
    depthCm: "35",
    imageUrl: "/images/products/lina-konsol.webp",
    translations: {
      tr: {
        name: "Lina Konsol",
        slug: "lina-konsol",
        shortDescription: "İnce metal ayaklı, ceviz tablalı konsol.",
        description:
          "Lina Konsol, dar ve uzun ceviz tablasını ince siyah metal ayaklar üzerinde taşır. Giriş holü ya da kanepe arkası için sade ve kullanışlı bir parçadır.",
        materialsText: "Ceviz ahşap tabla, siyah boyalı metal ayak",
        seoTitle: "Lina Konsol",
        seoDescription: "Ceviz tablalı, ince metal ayaklı Lina konsol sehpa. El işçiliği.",
      },
      en: {
        name: "Lina Console Table",
        slug: "lina-console-table",
        shortDescription: "A walnut console table on slim metal legs.",
        description:
          "The Lina Console carries its long, narrow walnut top on slim black metal legs. A simple, practical piece for an entrance hall or behind a sofa.",
        materialsText: "Walnut wood top, black painted metal legs",
        seoTitle: "Lina Console Table",
        seoDescription: "Lina console table with a walnut top on slim metal legs. Handcrafted.",
      },
      ru: {
        name: "Консольный столик Lina",
        slug: "konsol-lina",
        shortDescription: "Консоль с ореховой столешницей на тонких металлических ножках.",
        description:
          "Консоль Lina несёт узкую длинную ореховую столешницу на тонких чёрных металлических ножках. Простой и практичный предмет для прихожей или пространства за диваном.",
        materialsText: "Ореховая столешница, металлические ножки с чёрным покрытием",
        seoTitle: "Консольный столик Lina",
        seoDescription:
          "Консольный столик Lina с ореховой столешницей на тонких металлических ножках. Ручная работа.",
      },
      ar: {
        name: "طاولة كونسول Lina",
        slug: "lina-console-table",
        shortDescription: "طاولة كونسول بسطح من خشب الجوز على أرجل معدنية رفيعة.",
        description:
          "تحمل طاولة Lina سطحها الطويل الضيق من خشب الجوز على أرجل معدنية سوداء رفيعة. قطعة بسيطة وعملية لمدخل المنزل أو خلف الأريكة.",
        materialsText: "سطح من خشب الجوز، أرجل معدنية مطلية بالأسود",
        seoTitle: "طاولة كونسول Lina",
        seoDescription:
          "طاولة كونسول Lina بسطح من خشب الجوز على أرجل معدنية رفيعة، مصنوعة يدويًا.",
      },
    },
  },
];

/**
 * Demo katalog: 3 kategori ve 6 ürün, görselleri ve dört dildeki metinleriyle.
 * Site ilk açıldığında boş görünmesin diye; gerçek ürünler geldikçe
 * panelden düzenlenir ya da silinir. Katalogda tek bir kategori ya da ürün
 * bile varsa hiç çalışmaz.
 */
async function seedCatalog() {
  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  if (categoryCount > 0 || productCount > 0) {
    console.log("Katalogda kayıt var — demo kategori ve ürünler atlandı.");
    return;
  }

  // Tek işlem: yarıda kesilirse hiçbir şey yazılmaz, sonraki yayında
  // katalog hâlâ boş olduğu için baştan denenir.
  await prisma.$transaction(async (tx) => {
    const categoryIdByKey = {} as Record<(typeof demoCategories)[number]["key"], string>;

    for (const [index, category] of demoCategories.entries()) {
      const created = await tx.category.create({
        data: {
          sortOrder: index,
          coverImage: `/images/categories/${category.key}.webp`,
          translations: {
            create: Object.entries(category.translations).map(([languageCode, translation]) => ({
              ...translation,
              languageCode,
            })),
          },
        },
      });
      categoryIdByKey[category.key] = created.id;
    }

    for (const [index, product] of demoProducts.entries()) {
      await tx.product.create({
        data: {
          sku: product.sku,
          categoryId: categoryIdByKey[product.categorySlug],
          widthCm: product.widthCm,
          heightCm: product.heightCm,
          depthCm: product.depthCm,
          isFeatured: "isFeatured" in product,
          sortOrder: index,
          translations: {
            create: Object.entries(product.translations).map(([languageCode, translation]) => ({
              ...translation,
              languageCode,
            })),
          },
          images: {
            create: { url: product.imageUrl, isPrimary: true, sortOrder: 0 },
          },
        },
      });
    }
  }, { timeout: 60_000 });

  console.log(`${demoCategories.length} kategori ve ${demoProducts.length} demo ürün eklendi.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
