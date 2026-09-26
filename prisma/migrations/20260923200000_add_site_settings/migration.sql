-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "comingSoon" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id"),
    -- Tek satırlık tablo: ikinci bir ayar satırı açılamaz.
    CONSTRAINT "site_settings_single_row" CHECK ("id" = 1)
);

-- Mağaza açılana kadar ziyaretçiler "Yakında" sayfasını görür.
INSERT INTO "site_settings" ("id", "comingSoon", "updatedAt") VALUES (1, true, CURRENT_TIMESTAMP);
