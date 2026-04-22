import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/lib/db/assessments', () => ({
  getAllAssessments: () =>
    Promise.resolve([
      {
        id: 'a1',
        project_id: 'p1',
        project_name: 'My Project',
        name: 'My Assessment',
        description: null,
        test_date_start: null,
        test_date_end: null,
        status: 'ready',
        assigned_to: null,
        created_by: null,
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
        issue_count: 3,
      },
    ]),
}));

import AssessmentsPage from '../page';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

test('renders page heading', async () => {
  renderWithIntl(await AssessmentsPage());
  expect(screen.getByRole('heading', { name: /assessments/i })).toBeInTheDocument();
});

test('renders assessment name', async () => {
  renderWithIntl(await AssessmentsPage());
  expect(screen.getByText('My Assessment')).toBeInTheDocument();
});

test('renders project name', async () => {
  renderWithIntl(await AssessmentsPage());
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
