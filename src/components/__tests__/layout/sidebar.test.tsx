import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

test('renders all nav links with accessible labels', () => {
  render(<Sidebar />);
  expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /vpats/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
});

test('sidebar has navigation landmark', () => {
  render(<Sidebar />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('active route gets highlighted class', () => {
  render(<Sidebar />);
  // /dashboard is the active path (mocked)
  const dashLink = screen.getByRole('link', { name: /dashboard/i });
  expect(dashLink).toHaveClass('bg-sidebar-accent');
});

test('active link has aria-current="page"', () => {
  render(<Sidebar />);
  const dashLink = screen.getByRole('link', { name: /dashboard/i });
  expect(dashLink).toHaveAttribute('aria-current', 'page');
});

test('inactive links do not have aria-current', () => {
  render(<Sidebar />);
  const projectsLink = screen.getByRole('link', { name: /projects/i });
  expect(projectsLink).not.toHaveAttribute('aria-current');
});
