import { render, screen } from '@testing-library/react';
import { SeverityBadge } from '@/components/issues/severity-badge';

test('renders critical badge with red style', () => {
  render(<SeverityBadge severity="critical" />);
  const badge = screen.getByText(/critical/i);
  expect(badge).toHaveClass('bg-red-500/20');
});

test('renders high badge with orange style', () => {
  render(<SeverityBadge severity="high" />);
  const badge = screen.getByText(/high/i);
  expect(badge).toHaveClass('bg-orange-500/20');
});

test('renders medium badge with yellow style', () => {
  render(<SeverityBadge severity="medium" />);
  const badge = screen.getByText(/medium/i);
  expect(badge).toHaveClass('bg-yellow-500/20');
});

test('renders low badge with blue style', () => {
  render(<SeverityBadge severity="low" />);
  const badge = screen.getByText(/low/i);
  expect(badge).toHaveClass('bg-blue-500/20');
});
