"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { submitInquiryAction } from "@/app/[locale]/iletisim/actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({
  productId,
  productName,
}: {
  productId?: string;
  productName?: string;
}) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [state, action, pending] = useActionState(submitInquiryAction, undefined);

  if (state?.success) {
    return (
      <p className="rounded-sm border border-brand/20 bg-brand/5 px-6 py-8 font-body text-brand">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {productId && <input type="hidden" name="productId" value={productId} />}

      {/* Honeypot: ekran okuyucudan ve kullanıcıdan gizli, botlar doldurur.
          Boyut sıfırlama hem sarmalayıcıya hem input'a uygulanır — tarayıcı
          input'a kendi varsayılan genişliğini verir ve yalnızca üst
          elemandaki overflow-hidden görsel olarak keser; otomasyon
          araçları elemanın kendi sınırlayıcı kutusuna bakar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="h-0 w-0"
        />
      </div>

      {productName && (
        <p className="font-body text-sm text-ink/60">
          <span className="font-medium text-brand">{productName}</span>{" "}
          {t("productContext")}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" type="tel" dir="ltr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>

      {/* KVKK açık rıza — tarayıcı `required` ile engeller, sunucu da doğrular */}
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          value="yes"
          required
          className="mt-1 size-4 shrink-0 accent-brand"
        />
        <Label
          htmlFor="consent"
          className="font-body text-xs leading-relaxed font-normal text-ink/70"
        >
          {t.rich("consent", {
            link: (chunks) => (
              <Link
                href="/gizlilik-politikasi"
                className="text-brand underline underline-offset-2 hover:opacity-70"
              >
                {chunks}
              </Link>
            ),
          })}
        </Label>
      </div>

      {state?.error && (
        <p className="font-body text-sm text-destructive">
          {state.error === "rateLimited" ? t("rateLimited") : t("error")}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit bg-brand text-surface-warm hover:bg-brand/90"
      >
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
