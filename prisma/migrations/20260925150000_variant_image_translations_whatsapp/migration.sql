-- Varyant adı ve görsel alt metni için dil tabloları (Türkçesi mevcut
-- sütunlarda kalır) ve WhatsApp numarası. Yalnızca ekleme; mevcut veri
-- değişmez.

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "whatsappNumber" TEXT;

-- Mağazanın WhatsApp hattı panelde Site Ayarları'ndan girilir; boşken
-- sitede WhatsApp bağlantısı görünmez.

-- CreateTable
CREATE TABLE "product_variant_translations" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "product_variant_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image_translations" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "altText" TEXT NOT NULL,

    CONSTRAINT "product_image_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_translations_variantId_languageCode_key" ON "product_variant_translations"("variantId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "product_image_translations_imageId_languageCode_key" ON "product_image_translations"("imageId", "languageCode");

-- AddForeignKey
ALTER TABLE "product_variant_translations" ADD CONSTRAINT "product_variant_translations_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_translations" ADD CONSTRAINT "product_variant_translations_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image_translations" ADD CONSTRAINT "product_image_translations_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "product_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image_translations" ADD CONSTRAINT "product_image_translations_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;
