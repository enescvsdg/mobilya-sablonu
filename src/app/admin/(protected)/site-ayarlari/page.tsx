import { WhatsappSettingsForm } from "@/components/admin/whatsapp-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/dal";
import { getWhatsappNumber } from "@/lib/site-settings";

export default async function SiteSettingsPage() {
  await requireSuperAdmin();
  const whatsappNumber = await getWhatsappNumber();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Site Ayarları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sitenin işletme bilgileri. Yakında sayfasını açıp kapatma ayarı Panel
          ana sayfasındadır.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            İletişim sayfasındaki &quot;Bize Ulaşın&quot; bölümünde ve Yakında
            sayfasında görünür. Ziyaretçi tıklayınca WhatsApp açılır ve kendi
            dilinde &quot;Merhaba, bilgi alabilir miyim?&quot; mesajı hazır yazılı
            gelir.
          </p>
          <WhatsappSettingsForm current={whatsappNumber} />
        </CardContent>
      </Card>
    </div>
  );
}
