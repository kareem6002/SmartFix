import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
const ThemeContext = createContext<{ theme: ThemeMode; toggleTheme: () => void } | null>(null);
export const initialTheme = (): ThemeMode => {
  try { return localStorage.getItem('sf_theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
export const applyTheme = (theme: ThemeMode) => { document.documentElement.dataset.theme = theme; };
export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  useEffect(() => { applyTheme(theme); try { localStorage.setItem('sf_theme', theme); } catch { /* storage blocked */ } }, [theme]);
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
