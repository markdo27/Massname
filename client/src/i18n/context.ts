import { createContext } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

export type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

export interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslateFn;
}

export const I18nContext = createContext<I18nValue | null>(null);

export const LANG_STORAGE_KEY = 'reel-invitation-lang';

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'vi';
}

// Priority: ?lang= in the URL, then the saved choice, then the browser language.
export function detectInitialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); fall through to the browser language.
  }
  return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function translate(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  const template = translations[lang][key] ?? translations.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
