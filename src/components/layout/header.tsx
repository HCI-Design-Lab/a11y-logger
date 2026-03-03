'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-sidebar px-6">
      <div className="flex items-center gap-2">
        {/*<Accessibility className="h-6 w-6 text-primary" aria-hidden="true" />*/}
        <span className="font-semibold text-lg">A11y Logger</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={theme === 'dark'}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </header>
  );
}
