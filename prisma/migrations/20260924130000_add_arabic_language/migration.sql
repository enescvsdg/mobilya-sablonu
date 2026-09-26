-- Arapça dili (sağdan sola). Yalnızca dil tablosu doluysa, yani mevcut bir
-- kurulumda eklenir; boş veritabanında dilleri prisma/seed.ts ekler.
-- Demo katalogun Arapça çevirileri de seed'de (eksik olanlar tamamlanır).
INSERT INTO "languages" ("code", "name", "nativeName", "isActive", "isDefault", "sortOrder", "createdAt", "updatedAt")
SELECT 'ar', 'Arapça', 'العربية', true, false, 3, now(), now()
WHERE EXISTS (SELECT 1 FROM "languages")
ON CONFLICT ("code") DO NOTHING;
