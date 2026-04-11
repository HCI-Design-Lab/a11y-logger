import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SeverityBadge } from '../severity-badge';

const messages = {
  issues: {
    badge: {
      severity: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
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

test('renders critical badge label from translations', () => {
  renderWithIntl(<SeverityBadge severity="critical" />);
  expect(screen.getByText('Critical')).toBeInTheDocument();
});

test('renders high badge label from translations', () => {
  renderWithIntl(<SeverityBadge severity="high" />);
  expect(screen.getByText('High')).toBeInTheDocument();
});

test('renders medium badge label from translations', () => {
  renderWithIntl(<SeverityBadge severity="medium" />);
  expect(screen.getByText('Medium')).toBeInTheDocument();
});

test('renders low badge label from translations', () => {
  renderWithIntl(<SeverityBadge severity="low" />);
  expect(screen.getByText('Low')).toBeInTheDocument();
});

test('critical badge still has red style', () => {
  renderWithIntl(<SeverityBadge severity="critical" />);
  const badge = screen.getByText('Critical').closest('span');
  expect(badge).toHaveClass('bg-red-500/20');
});

test('renders translated label when translations differ from English', () => {
  const frMessages = {
    issues: {
      badge: {
        severity: {
          critical: 'Critique',
          high: 'Élevée',
          medium: 'Moyenne',
          low: 'Faible',
        },
      },
    },
  };
  render(
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      <SeverityBadge severity="critical" />
    </NextIntlClientProvider>
  );
  expect(screen.getByText('Critique')).toBeInTheDocument();
});
