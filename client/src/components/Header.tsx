import { Film } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { LANGUAGE_LABELS, type Lang } from '../i18n/translations';

export function Header() {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0 truncate">Reel Invitation</h1>
            <p className="text-xs text-rose-400 font-semibold m-0">{t('madeFor')}</p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Language / Ngôn ngữ"
          className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0"
        >
          {(Object.keys(LANGUAGE_LABELS) as Lang[]).map(code => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                lang === code ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{code.toUpperCase()}</span>
              <span className="hidden sm:inline">{LANGUAGE_LABELS[code]}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
