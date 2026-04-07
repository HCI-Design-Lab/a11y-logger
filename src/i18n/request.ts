import { getRequestConfig } from 'next-intl/server';
import { getSetting } from '@/lib/db/settings';

const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export default getRequestConfig(async () => {
  let locale: SupportedLocale = 'en';
  try {
    const stored = getSetting('language');
    if (isSupportedLocale(stored)) {
      locale = stored;
    }
  } catch {
    // Database not available at build time; fall back to English
  }

  const messages = (await import(`../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale,
    messages: messages.default,
  };
});
