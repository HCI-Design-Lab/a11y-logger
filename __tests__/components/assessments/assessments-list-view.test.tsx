import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));
import { AssessmentsListView } from '@/components/assessments/assessments-list-view';
import type { AssessmentWithProject } from '@/lib/db/assessments';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

const mockAssessments: AssessmentWithProject[] = [
  {
    id: 'a1',
    project_id: 'p1',
    project_name: 'My Project',
    name: 'Q1 Audit',
    description: null,
    status: 'ready',
    issue_count: 2,
    test_date_start: null,
    test_date_end: null,
    assigned_to: null,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('AssessmentsListView', () => {
  it('defaults to table view', () => {
    renderWithIntl(<AssessmentsListView assessments={mockAssessments} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    renderWithIntl(<AssessmentsListView assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Q1 Audit')).toBeInTheDocument();
  });
});
