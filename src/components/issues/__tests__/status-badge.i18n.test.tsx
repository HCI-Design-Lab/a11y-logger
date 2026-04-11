import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { StatusBadge } from '../status-badge';

const messages = {
  issues: {
    badge: {
      status: {
        open: 'Open',
        resolved: 'Resolved',
        wont_fix: "Won't Fix",
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

test('renders open status label from translations', () => {
  renderWithIntl(<StatusBadge status="open" />);
  expect(screen.getByText('Open')).toBeInTheDocument();
});

test('renders resolved status label from translations', () => {
  renderWithIntl(<StatusBadge status="resolved" />);
  expect(screen.getByText('Resolved')).toBeInTheDocument();
});

test('renders wont_fix status label from translations', () => {
  renderWithIntl(<StatusBadge status="wont_fix" />);
  expect(screen.getByText("Won't Fix")).toBeInTheDocument();
});

test('renders translated label when translations differ from English', () => {
  const frMessages = {
    issues: {
      badge: {
        status: {
          open: 'Ouvert',
          resolved: 'Résolu',
          wont_fix: 'Ne sera pas corrigé',
        },
      },
    },
  };
  render(
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      <StatusBadge status="open" />
    </NextIntlClientProvider>
  );
  expect(screen.getByText('Ouvert')).toBeInTheDocument();
});
