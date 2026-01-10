import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const locales = ["it", "en"] as const;
type Locale = (typeof locales)[number];

function isValidLocale(locale: string | undefined): locale is Locale {
  return locale !== undefined && locales.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  // Get locale from cookie or header, default to 'it'
  const cookieStore = await cookies();
  const headersList = await headers();
  
  let locale = cookieStore.get("NEXT_LOCALE")?.value;
  
  if (!locale || !isValidLocale(locale)) {
    // Try Accept-Language header
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0];
      if (isValidLocale(preferredLocale)) {
        locale = preferredLocale;
      }
    }
  }
  
  // Default to 'it' if no valid locale found
  if (!locale || !isValidLocale(locale)) {
    locale = "it";
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});
