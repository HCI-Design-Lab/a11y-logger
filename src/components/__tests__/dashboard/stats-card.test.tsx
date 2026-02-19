import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';

test('renders label and count', () => {
  render(<StatsCard label="Projects" count={5} />);
  expect(screen.getByText('Total Projects')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('renders zero count', () => {
  render(<StatsCard label="Issues" count={0} />);
  expect(screen.getByText('0')).toBeInTheDocument();
});
