import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, LANG_STORAGE_KEY, detectInitialLang, translate } from './context';
import type { Lang, TranslationKey } from './translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Not critical: the choice just won't be remembered.
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params),
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
