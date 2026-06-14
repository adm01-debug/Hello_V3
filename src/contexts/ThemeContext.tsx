/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeSkin = 'default' | 'midnight' | 'ocean' | 'sunset' | 'forest';

interface ThemeContextType {
  theme: ThemeMode;
  skin: ThemeSkin;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setSkin: (skin: ThemeSkin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('voip-theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  const [skin, setSkinState] = useState<ThemeSkin>(() => {
    const stored = localStorage.getItem('voip-skin');
    return (['default', 'midnight', 'ocean', 'sunset', 'forest'].includes(stored || '') ? stored : 'default') as ThemeSkin;
  });

  useEffect(() => {
    localStorage.setItem('voip-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('voip-skin', skin);
    const root = document.documentElement;
    // Remove all skin classes
    root.classList.remove('skin-default', 'skin-midnight', 'skin-ocean', 'skin-sunset', 'skin-forest');
    if (skin !== 'default') {
      root.classList.add(`skin-${skin}`);
    }
  }, [skin]);

  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  const setTheme = (t: ThemeMode) => setThemeState(t);
  const setSkin = (s: ThemeSkin) => setSkinState(s);

  return (
    <ThemeContext.Provider value={{ theme, skin, toggleTheme, setTheme, setSkin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}