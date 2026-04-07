'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
] as const;

interface HeaderProps {
  currentLocale?: string;
}

export function Header({ currentLocale = 'en' }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  async function handleLanguageChange(locale: string) {
    await fetch('/api/settings/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: locale }),
    });
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-card px-6">
      <div className="flex items-center gap-2">
        {/*<Accessibility className="h-6 w-6 text-primary" aria-hidden="true" />*/}
        <span className="font-semibold text-sm tracking-tight">A11y Logger</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="language-selector">
          Language
        </label>
        <select
          id="language-selector"
          aria-label="Language"
          value={currentLocale}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="text-sm bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
