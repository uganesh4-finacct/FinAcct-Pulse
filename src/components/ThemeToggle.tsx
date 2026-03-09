'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title={`Current: ${theme}`}
    >
      {theme === 'system' ? (
        <Monitor className="w-5 h-5 text-zinc-500" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="w-5 h-5 text-zinc-400" />
      ) : (
        <Sun className="w-5 h-5 text-zinc-600" />
      )}
    </button>
  );
}
