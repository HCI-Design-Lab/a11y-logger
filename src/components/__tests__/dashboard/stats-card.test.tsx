import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';

test('renders label and count', () => {
  render(<StatsCard label="Projects" count={5} href="/projects" />);
  expect(screen.getByText('Projects')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('renders zero count', () => {
  render(<StatsCard label="Issues" count={0} href="/issues" />);
  expect(screen.getByText('0')).toBeInTheDocument();
});

test('renders as a link with accessible label', () => {
  render(<StatsCard label="Projects" count={5} href="/projects" />);
  const link = screen.getByRole('link', { name: 'Projects 5' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects');
});

test('accessible label includes zero count', () => {
  render(<StatsCard label="Reports" count={0} href="/reports" />);
  const link = screen.getByRole('link', { name: 'Reports 0' });
  expect(link).toBeInTheDocument();
});

test('renders subtitle when provided', () => {
  render(<StatsCard label="Active Projects" count={3} href="/projects" subtitle="of 5 total" />);
  expect(screen.getByText('of 5 total')).toBeInTheDocument();
});

test('renders trend when provided', () => {
  render(<StatsCard label="Issues" count={2} href="/issues" trend="↑ vs 6 last month" />);
  expect(screen.getByText('↑ vs 6 last month')).toBeInTheDocument();
});

test('renders alert indicator when alert is true', () => {
  render(<StatsCard label="Critical" count={4} href="/issues" alert />);
  expect(screen.getByLabelText('alert')).toBeInTheDocument();
});

test('does not render alert indicator when alert is false', () => {
  render(<StatsCard label="Critical" count={0} href="/issues" alert={false} />);
  expect(screen.queryByLabelText('alert')).not.toBeInTheDocument();
});
