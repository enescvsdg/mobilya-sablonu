import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { withBrand } from "./brand-messages";
import { routing } from "./routing";

/** Marka adları yerleştirilmiş metinler; dil başına bir kez hazırlanır. */
const brandedMessages = new Map<string, Record<string, unknown>>();

async function loadMessages(locale: string) {
  let messages = brandedMessages.get(locale);
  if (!messages) {
    messages = withBrand((await import(`../../messages/${locale}.json`)).default);
    brandedMessages.set(locale, messages!);
  }
  return messages!;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
