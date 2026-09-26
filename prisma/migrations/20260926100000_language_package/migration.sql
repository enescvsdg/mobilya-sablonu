-- Dil paketi: Almanca, Fransızca, Farsça, Azerbaycan Türkçesi, İspanyolca,
-- İtalyanca. Arayüz çevirileri kodda hazır; diller kapalı eklenir, panelden
-- "Hazırlığa al" ile çeviri alanları, "Yayına al" ile site açılır.

-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "isPreparing" BOOLEAN NOT NULL DEFAULT false;

-- Yalnızca dil tablosu doluysa, yani mevcut bir kurulumda eklenir; boş
-- veritabanında dilleri prisma/seed.ts ekler (aynı liste).
INSERT INTO "languages" ("code", "name", "nativeName", "isActive", "isPreparing", "isDefault", "sortOrder", "createdAt", "updatedAt")
SELECT v."code", v."name", v."nativeName", false, false, false,
       (SELECT COALESCE(MAX("sortOrder"), -1) FROM "languages") + v."position", now(), now()
FROM (VALUES
  ('de', 'Almanca', 'Deutsch', 1),
  ('fr', 'Fransızca', 'Français', 2),
  ('fa', 'Farsça', 'فارسی', 3),
  ('az', 'Azerbaycan Türkçesi', 'Azərbaycanca', 4),
  ('es', 'İspanyolca', 'Español', 5),
  ('it', 'İtalyanca', 'Italiano', 6)
) AS v("code", "name", "nativeName", "position")
WHERE EXISTS (SELECT 1 FROM "languages")
ON CONFLICT ("code") DO NOTHING;
