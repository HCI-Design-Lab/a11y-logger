import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { Sidebar } from '@/components/layout/sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

const messages = {
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    assessments: 'Assessments',
    issues: 'Issues',
    reports: 'Reports',
    vpats: 'VPATs',
    settings: 'Settings',
  },
};

function renderSidebar() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Sidebar />
    </NextIntlClientProvider>
  );
}

test('renders all nav links with accessible labels', () => {
  renderSidebar();
  expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /assessments/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /issues/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /vpats/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
});

test('sidebar has navigation landmark', () => {
  renderSidebar();
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('active route gets highlighted class', () => {
  renderSidebar();
  // /dashboard is the active path (mocked)
  const dashLink = screen.getByRole('link', { name: /dashboard/i });
  expect(dashLink.className).toContain('before:bg-foreground');
});

test('active link has aria-current="page"', () => {
  renderSidebar();
  const dashLink = screen.getByRole('link', { name: /dashboard/i });
  expect(dashLink).toHaveAttribute('aria-current', 'page');
});

test('inactive links do not have aria-current', () => {
  renderSidebar();
  const projectsLink = screen.getByRole('link', { name: /projects/i });
  expect(projectsLink).not.toHaveAttribute('aria-current');
});

test('nav label text is present in the DOM for each item', () => {
  renderSidebar();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Projects')).toBeInTheDocument();
  expect(screen.getByText('Assessments')).toBeInTheDocument();
  expect(screen.getByText('Issues')).toBeInTheDocument();
  expect(screen.getByText('Reports')).toBeInTheDocument();
  expect(screen.getByText('VPATs')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
});

test('nav labels are aria-hidden', () => {
  renderSidebar();
  const labels = screen.getAllByText(
    /dashboard|projects|assessments|issues|reports|vpats|settings/i
  );
  const visibleLabels = labels.filter((el) => el.tagName === 'SPAN');
  visibleLabels.forEach((label) => {
    expect(label).toHaveAttribute('aria-hidden', 'true');
  });
});

test('nav element is absolutely positioned for overlay behaviour', () => {
  renderSidebar();
  expect(screen.getByRole('navigation')).toHaveClass('absolute');
});
