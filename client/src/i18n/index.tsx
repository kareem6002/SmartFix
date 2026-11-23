import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import bsLtr from 'bootstrap/dist/css/bootstrap.min.css?url';
import bsRtl from 'bootstrap/dist/css/bootstrap.rtl.min.css?url';
import { DICTS, Keys, Lang, errorMessage, format, yearsText } from './core';
export type { Keys, Lang } from './core';

export const getInitialLang = (): Lang => {
  try { const s = localStorage.getItem('sf_lang'); if (s === 'ar' || s === 'en') return s; } catch { /* storage blocked */ }
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
};

/** Swap Bootstrap between its left-to-right and right-to-left builds, then set <html lang/dir>. */
export function applyDocLang(lang: Lang): Promise<void> {
  const href = lang === 'ar' ? bsRtl : bsLtr;
  const old = document.getElementById('bs-css') as HTMLLinkElement | null;
  const done = () => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; };
  if (old && old.getAttribute('href') === href) { done(); return Promise.resolve(); }
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    const finish = () => { old?.remove(); link.id = 'bs-css'; done(); resolve(); };
    link.onload = finish; link.onerror = finish;
    document.head.prepend(link);              // before our own styles so ours still win
  });
}

interface Ctx {
  lang: Lang; dir: 'ltr' | 'rtl'; setLang: (l: Lang) => void;
  t: (key: Keys, vars?: Record<string, string | number>) => string;
  tc: (category: string) => string;          // category name from the database -> translated label
  ts: (status: string) => string;            // request status -> translated label
  years: (n: number) => string;
  date: (d: string | number | Date) => string;
  err: (message: string) => string;          // server error -> translated message
}
const I18nCtx = createContext<Ctx>(null!);
export const useI18n = () => useContext(I18nCtx);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem('sf_lang', l); } catch { /* ignore */ }
    applyDocLang(l).then(() => setLangState(l));
  }, []);
  const value = useMemo<Ctx>(() => {
    const d = DICTS[lang];
    const lookup = (prefix: string, name: string) => d[`${prefix}.${name}` as Keys] ?? name;
    return {
      lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang,
      t: (key, vars) => format(d[key], vars),
      tc: name => lookup('cat', name), ts: s => lookup('status', s),
      years: n => yearsText(lang, n),
      date: x => new Date(x).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB'),
      err: m => errorMessage(lang, m),
    };
  }, [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}
