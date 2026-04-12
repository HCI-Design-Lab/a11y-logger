'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LANGUAGE_OPTION_KEYS = ['en', 'fr', 'es', 'de'] as const;

interface HeaderProps {
  currentLocale?: string;
}

export function Header({ currentLocale = 'en' }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const tUi = useTranslations('ui');
  const tLang = useTranslations('settings.language');
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        {/*<Accessibility className="h-6 w-6 text-primary" aria-hidden="true" />*/}
        <span className="font-semibold text-sm tracking-tight">A11y Logger</span>
      </div>
      <div className="flex items-center gap-2">
        <Select value={currentLocale} onValueChange={handleLanguageChange}>
          <SelectTrigger
            id="language-selector"
            aria-label={tUi('language_select.aria_label')}
            className="w-auto text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTION_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {tLang(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="border border-input"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={
            isDark ? tUi('theme_toggle.light_aria_label') : tUi('theme_toggle.dark_aria_label')
          }
          aria-pressed={isDark}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
