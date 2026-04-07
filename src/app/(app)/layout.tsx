import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';
import { getSetting } from '@/lib/db/settings';
import { getSession } from '@/lib/auth/session';
import { getLocale } from 'next-intl/server';

// All pages under this layout read from the database at request time —
// prevent Next.js from attempting static pre-rendering.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = Boolean(getSetting('auth_enabled'));
  if (authEnabled) {
    const userId = await getSession();
    if (!userId) redirect('/login');
  }
  const locale = await getLocale();
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-ring"
      >
        Skip to main content
      </a>
      <Header currentLocale={locale} />
      <div className="flex flex-1 overflow-hidden">
        <div className="relative w-14 shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto p-6" id="main-content">
          <div className="max-w-350"> {children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
