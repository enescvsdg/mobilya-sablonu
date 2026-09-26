import { redirect } from "next/navigation";

import { MissingTranslations } from "@/components/admin/missing-translations";
import { getCurrentAdmin } from "@/lib/dal";
import { getEditableLanguageCodes } from "@/lib/languages";
import { allows, type Section } from "@/lib/permissions";
import { isTranslationConfigured } from "@/lib/translation";
import { findTranslationGaps } from "@/lib/translation-gaps";
import type { TranslatableKind } from "@/lib/translation-rules";

// Her kayıt çevrilirken Google'ın yanıtı beklenir; varsayılan süre yetmeyebilir.
export const maxDuration = 60;

const KIND_SECTIONS: [TranslatableKind, Section][] = [
  ["product", "products"],
  ["category", "categories"],
  ["content", "content"],
];

export default async function MissingTranslationsPage() {
  const admin = await getCurrentAdmin();
  // Yalnızca düzenleyebildiği bölümlerin kayıtları listelenir.
  const kinds = KIND_SECTIONS.filter(([, section]) =>
    allows(admin.permissions, section, "edit")
  ).map(([kind]) => kind);
  if (kinds.length === 0) redirect("/admin/yetkisiz");

  const gaps = await findTranslationGaps(kinds, await getEditableLanguageCodes());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Eksik Çeviriler</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Türkçesi yazılmış ama diğer dillerde boş kalan alanlar. &quot;Çevir&quot; ya da
          &quot;Tümünü çevir&quot; bu alanları Google Gemini ile çevirip hemen kaydeder;
          dolu alanlara dokunmaz. Çevrilen kayıtları &quot;Kontrol et&quot; ile açıp gözden
          geçirebilirsiniz.
        </p>
      </div>

      <MissingTranslations items={gaps} enabled={isTranslationConfigured()} />
    </div>
  );
}
