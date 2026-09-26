import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  PencilLine,
  Star,
  X,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { BUILD_SUPPORTED_LOCALES, isBuildSupported } from "@/lib/languages";
import { findTranslationGaps } from "@/lib/translation-gaps";
import { TRANSLATION_SOURCE } from "@/lib/translation-rules";
import {
  deleteLanguageAction,
  moveLanguageAction,
  setLanguagePreparingAction,
  toggleLanguageActiveAction,
} from "@/app/admin/actions/languages";
import { ActionButton } from "@/components/admin/action-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { LanguageForm } from "@/components/admin/language-form";
import { LanguageNameCells } from "@/components/admin/language-name-cells";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

export default async function AdminLanguagesPage() {
  const admin = await requireView("languages");
  const canEdit = allows(admin.permissions, "languages", "edit");
  const languages = await prisma.language.findMany({ orderBy: { sortOrder: "asc" } });
  // "Çevirisi tamam": Eksik Çeviriler ile aynı ölçü. Boş bırakılıp
  // kaydedilen dilde Türkçenin kopyası durur; o ürün çevrilmiş sayılmaz.
  const [sourceCount, gaps] = await Promise.all([
    prisma.productTranslation.count({ where: { languageCode: TRANSLATION_SOURCE } }),
    findTranslationGaps(
      ["product"],
      languages.map((language) => language.code)
    ),
  ]);
  const translatedCount = (code: string) =>
    code === TRANSLATION_SOURCE
      ? sourceCount
      : sourceCount - gaps.filter((gap) => gap.missing[code]).length;

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Diller</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Her dil üç durumdan birindedir. <strong>Kapalı</strong>: yalnızca bu
          listede durur. <strong>Hazırlıkta</strong>: sitede görünmez ama
          panelde (ürün, kategori ve site metni formlarında, Eksik
          Çeviriler&apos;de) alanları açılır. <strong>Yayında</strong>: sitede
          dil menüsünde görünür ve Google&apos;a bildirilir.
        </p>
      </div>

      <div className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
        <p className="font-semibold">Yeni bir dili açmak</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-muted-foreground">
          <li>
            Dilin satırında <strong className="text-foreground">Hazırlığa al</strong>.
          </li>
          <li>
            <strong className="text-foreground">Eksik Çeviriler → Tümünü çevir</strong> ile
            ürünleri, kategorileri ve site metinlerini o dile çevirin; gerekirse
            düzeltin.
          </li>
          <li>
            <strong className="text-foreground">Sitede önizle</strong> ile sitenin o dildeki
            hâline bakın (ziyaretçiler görmez).
          </li>
          <li>
            Hazır olunca <strong className="text-foreground">Yayına al</strong>.
          </li>
        </ol>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Sıra</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>Adı</TableHead>
                <TableHead>Kendi dilinde</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead
                  className="text-right"
                  title="Adı, açıklaması, varyant adları ve alt metinleri bu dile çevrilmiş ürünler (Eksik Çeviriler ile aynı ölçü)"
                >
                  Çevirisi tamam
                </TableHead>
                <TableHead className="w-80" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((language, index) => {
                const supported = isBuildSupported(language.code);
                // Sitenin ana dili ve çevirilerin kaynağı; her zaman yayında.
                const isMain = language.code === routing.defaultLocale;
                return (
                  <TableRow key={language.code} data-testid={`dil-${language.code}`}>
                    <TableCell>
                      <div className="flex gap-1">
                        <ActionButton
                          action={moveLanguageAction.bind(null, language.code, "up")}
                          successMessage="Sıra güncellendi."
                          size="icon"
                          variant="ghost"
                          title="Yukarı taşı"
                          disabled={index === 0}
                        >
                          <ArrowUp className="size-4" />
                        </ActionButton>
                        <ActionButton
                          action={moveLanguageAction.bind(null, language.code, "down")}
                          successMessage="Sıra güncellendi."
                          size="icon"
                          variant="ghost"
                          title="Aşağı taşı"
                          disabled={index === languages.length - 1}
                        >
                          <ArrowDown className="size-4" />
                        </ActionButton>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{language.code}</TableCell>
                    <LanguageNameCells
                      code={language.code}
                      name={language.name}
                      nativeName={language.nativeName}
                    />
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {isMain && (
                          <Badge className="gap-1" title="Sitenin ana dili ve çevirilerin kaynağı">
                            <Star className="size-3" />
                            Varsayılan
                          </Badge>
                        )}
                        {language.isActive ? (
                          <Badge variant="secondary">Yayında</Badge>
                        ) : language.isPreparing ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-900"
                          >
                            Hazırlıkta
                          </Badge>
                        ) : (
                          <Badge variant="outline">Kapalı</Badge>
                        )}
                        {!supported && (
                          <Badge variant="destructive" title="messages/<kod>.json ve routing.ts eksik">
                            Arayüz çevirisi yok
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {translatedCount(language.code)} / {sourceCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {!language.isActive && supported && (
                          <>
                            {language.isPreparing ? (
                              <>
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={`/admin/onizleme?hedef=${encodeURIComponent(`/${language.code}`)}`}
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    <ExternalLink />
                                    Sitede önizle
                                  </a>
                                </Button>
                                <ActionButton
                                  action={setLanguagePreparingAction.bind(
                                    null,
                                    language.code,
                                    false
                                  )}
                                  successMessage={`${language.name} hazırlıktan çıkarıldı.`}
                                  title="Panel formlarındaki alanları kapatır; yazılmış çeviriler silinmez"
                                >
                                  <X className="size-4" />
                                  Hazırlıktan çıkar
                                </ActionButton>
                              </>
                            ) : (
                              <ActionButton
                                action={setLanguagePreparingAction.bind(null, language.code, true)}
                                successMessage={`${language.name} hazırlığa alındı. Çeviri alanları panelde açıldı.`}
                                title="Sitede görünmez; panelde çeviri alanları açılır"
                              >
                                <PencilLine className="size-4" />
                                Hazırlığa al
                              </ActionButton>
                            )}
                          </>
                        )}
                        {!isMain && (language.isActive || supported) && (
                          <ActionButton
                            action={toggleLanguageActiveAction.bind(
                              null,
                              language.code,
                              !language.isActive
                            )}
                            successMessage={
                              language.isActive
                                ? `${language.name} yayından kaldırıldı.`
                                : `${language.name} yayına alındı.`
                            }
                            confirmMessage={
                              language.isActive
                                ? `"${language.name}" sitede gizlensin mi? Ziyaretçiler bu dildeki sayfalara giremez; çeviriler silinmez.`
                                : `"${language.name}" sitede herkese açılsın mı? Dil menüsünde görünür ve Google'a bildirilir. Ürün ve kategorilerin çevirisini Eksik Çeviriler ekranından tamamladığınızdan emin olun.`
                            }
                          >
                            {language.isActive ? (
                              <>
                                <EyeOff className="size-4" />
                                Yayından kaldır
                              </>
                            ) : (
                              <>
                                <Eye className="size-4" />
                                Yayına al
                              </>
                            )}
                          </ActionButton>
                        )}
                        {!isMain && (
                          <DeleteButton
                            action={deleteLanguageAction.bind(null, language.code)}
                            confirmMessage={`"${language.name}" dilini silmek istediğine emin misin? Bu dildeki tüm ürün ve kategori çevirileri de silinir.`}
                            label={`"${language.name}" dilini sil`}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {languages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Henüz dil yok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listede olmayan bir dil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p>
              Sitenin kendi yazıları (menü, düğmeler, form, KVKK ve Kullanım
              Şartları, Yakında sayfası) kodda tutulur ve şu diller için
              hazırdır:{" "}
              <span className="font-mono font-semibold">
                {BUILD_SUPPORTED_LOCALES.join(", ")}
              </span>
              . Bunların dışında bir dil buradan eklenebilir ama yazılımcı{" "}
              <code className="rounded bg-amber-100 px-1">src/i18n/routing.ts</code> ile{" "}
              <code className="rounded bg-amber-100 px-1">messages/&lt;kod&gt;.json</code>{" "}
              dosyasını ekleyene kadar hazırlığa ya da yayına alınamaz.
            </p>
          </div>
          <LanguageForm />
        </CardContent>
      </Card>
    </div>
    </ReadOnlySection>
  );
}
