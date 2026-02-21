'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, FileText, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/reports', icon: FileText, label: 'Reports' },
  { href: '/vpats', icon: Shield, label: 'VPATs' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      className="flex h-screen w-14 flex-col items-center border-r bg-sidebar py-4 gap-1"
      aria-label="Main navigation"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <span className="text-xs font-bold text-primary-foreground">A11y</span>
      </div>
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={pathname === href || pathname.startsWith(href + '/') ? 'page' : undefined}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent',
            (pathname === href || pathname.startsWith(href + '/')) && 'bg-sidebar-accent'
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}
