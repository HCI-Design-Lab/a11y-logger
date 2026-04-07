import { getRequestConfig } from 'next-intl/server';
import { getSetting } from '@/lib/db/settings';

const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export default getRequestConfig(async () => {
  const stored = getSetting('language');
  const locale = isSupportedLocale(stored) ? stored : 'en';

  const messages = (await import(`../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale,
    messages: messages.default,
  };
});
