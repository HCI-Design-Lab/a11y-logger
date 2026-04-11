'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  Bug,
  FileText,
  Shield,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/projects', icon: FolderOpen, label: t('projects') },
    { href: '/assessments', icon: ClipboardList, label: t('assessments') },
    { href: '/issues', icon: Bug, label: t('issues') },
    { href: '/reports', icon: FileText, label: t('reports') },
    { href: '/vpats', icon: Shield, label: t('vpats') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ];
  return (
    <nav
      className="group absolute left-0 top-0 z-10 flex h-full w-14 hover:w-48 flex-col overflow-hidden border-r bg-sidebar py-4 gap-1 transition-[width] duration-200 ease-in-out"
      aria-label="Main navigation"
    >
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={pathname === href || pathname.startsWith(href + '/') ? 'page' : undefined}
          className={cn(
            'relative flex h-10 w-full items-center gap-3 px-4.5 transition-colors text-muted-foreground hover:text-foreground',
            pathname === href || pathname.startsWith(href + '/')
              ? 'text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-foreground'
              : ''
          )}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="whitespace-nowrap opacity-0 transition-opacity duration-150 delay-100 group-hover:opacity-100"
          >
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
