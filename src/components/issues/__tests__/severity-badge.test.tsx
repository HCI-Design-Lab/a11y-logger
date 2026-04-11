import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SeverityBadge } from '@/components/issues/severity-badge';

const messages = {
  issues: {
    badge: {
      severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

test('renders critical badge with red style', () => {
  renderWithIntl(<SeverityBadge severity="critical" />);
  const badge = screen.getByText(/critical/i);
  expect(badge).toHaveClass('bg-red-500/20');
});

test('renders high badge with orange style', () => {
  renderWithIntl(<SeverityBadge severity="high" />);
  const badge = screen.getByText(/high/i);
  expect(badge).toHaveClass('bg-orange-500/20');
});

test('renders medium badge with yellow style', () => {
  renderWithIntl(<SeverityBadge severity="medium" />);
  const badge = screen.getByText(/medium/i);
  expect(badge).toHaveClass('bg-yellow-500/20');
});

test('renders low badge with blue style', () => {
  renderWithIntl(<SeverityBadge severity="low" />);
  const badge = screen.getByText(/low/i);
  expect(badge).toHaveClass('bg-blue-500/20');
});
