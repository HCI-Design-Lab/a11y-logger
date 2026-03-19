import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';

test('renders label and count', () => {
  render(<StatsCard label="Projects" count={5} href="/projects" />);
  expect(screen.getByText(/Total/)).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('renders zero count', () => {
  render(<StatsCard label="Issues" count={0} href="/issues" />);
  expect(screen.getByText('0')).toBeInTheDocument();
});

test('renders as a link with accessible label', () => {
  render(<StatsCard label="Projects" count={5} href="/projects" />);
  const link = screen.getByRole('link', { name: 'Total Projects 5' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects');
});

test('accessible label includes zero count', () => {
  render(<StatsCard label="Reports" count={0} href="/reports" />);
  const link = screen.getByRole('link', { name: 'Total Reports 0' });
  expect(link).toBeInTheDocument();
});
