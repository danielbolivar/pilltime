import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { en } from './en';
import { es } from './es';

export type AppLanguage = 'system' | 'en' | 'es';

const i18n = new I18n({ en, es });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function deviceLocale(): 'en' | 'es' {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code.startsWith('es') ? 'es' : 'en';
}

export function applyLanguage(language: AppLanguage): void {
  i18n.locale = language === 'system' ? deviceLocale() : language;
}

applyLanguage('system');

export type TxKey = string;

export function t(key: TxKey, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export function getLocale(): string {
  return i18n.locale;
}

export function isSpanish(): boolean {
  return i18n.locale.startsWith('es');
}

export { i18n };
