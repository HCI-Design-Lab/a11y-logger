import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-ring"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="relative w-14 shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto p-6 max-w-300" id="main-content">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
