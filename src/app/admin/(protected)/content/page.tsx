import { getEditableLanguages } from "@/lib/languages";
import { isTranslationConfigured } from "@/lib/translation";
import { CONTENT_BLOCKS, getStoredContent } from "@/lib/site-content";
import { SiteContentForm } from "@/components/admin/site-content-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

// Otomatik çeviri Google'ın yanıtını bekler; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

export default async function AdminContentPage() {
  const admin = await requireView("content");
  const canEdit = allows(admin.permissions, "content", "edit");
  const [languages, stored] = await Promise.all([
    getEditableLanguages(),
    getStoredContent(),
  ]);
  const translationEnabled = isTranslationConfigured();

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Site Metinleri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ana sayfa ve Hakkımızda bölümlerinin başlık, metin ve görselleri. Bir
          alanı boş bırakırsan sitede hazır metin görünmeye devam eder.
        </p>
      </div>

      {CONTENT_BLOCKS.map((block) => {
        const byLanguage = stored.get(block.key);

        const values = Object.fromEntries(
          languages.map((language) => [
            language.code,
            byLanguage?.get(language.code) ?? { title: "", body: "", imageUrl: "" },
          ])
        );

        // Görsel blok başına tek; hangi dilde kayıtlıysa onu göster.
        const storedImage = byLanguage
          ? [...byLanguage.values()].map((value) => value.imageUrl).find(Boolean)
          : undefined;

        const hasStoredValues = byLanguage
          ? [...byLanguage.values()].some(
              (value) => value.title || value.body || value.imageUrl
            )
          : false;

        return (
          <Card key={block.key}>
            <CardContent>
              <SiteContentForm
                contentKey={block.key}
                label={block.label}
                hint={block.hint}
                fields={block.fields}
                languages={languages}
                values={values}
                currentImage={storedImage || block.defaultImage || ""}
                hasStoredValues={hasStoredValues}
                translationEnabled={translationEnabled}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
    </ReadOnlySection>
  );
}
