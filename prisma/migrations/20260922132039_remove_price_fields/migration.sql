-- Fiyat gösterilmiyor: fiyatla ilgili tüm alanlar kaldırılıyor.
ALTER TABLE "products" DROP COLUMN "priceType";
ALTER TABLE "products" DROP COLUMN "price";
ALTER TABLE "products" DROP COLUMN "currency";
ALTER TABLE "product_variants" DROP COLUMN "extraPrice";
DROP TYPE "PriceType";
