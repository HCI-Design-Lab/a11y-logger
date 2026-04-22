import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/components/assessments/all-assessments-table', () => ({
  AllAssessmentsTable: () => <div data-testid="assessments-table" />,
}));
vi.mock('@/components/assessments/assessment-card', () => ({
  AssessmentCard: ({ assessment }: { assessment: { id: string; name: string } }) => (
    <div data-testid="assessment-card">{assessment.name}</div>
  ),
}));

import { AssessmentsListView } from '../assessments-list-view';
import type { AssessmentWithProject } from '@/lib/db/assessments';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

const mockAssessment: AssessmentWithProject = {
  id: 'a1',
  project_id: 'p1',
  name: 'Q1 Audit',
  description: null,
  test_date_start: null,
  test_date_end: null,
  status: 'ready',
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  issue_count: 3,
  project_name: 'My Project',
};

describe('AssessmentsListView layout', () => {
  it('renders the New Assessment link', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('link', { name: /new assessment/i })).toBeInTheDocument();
  });

  it('ViewToggle is in the header row with the New Assessment button', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    const heading = screen.getByRole('heading', { name: 'Assessments' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });

  it('switches to grid view when Grid view button is clicked', async () => {
    renderWithIntl(<AssessmentsListView assessments={[mockAssessment]} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.getByTestId('assessment-card')).toBeInTheDocument();
    expect(screen.queryByTestId('assessments-table')).not.toBeInTheDocument();
  });

  it('wraps content in a section with aria-labelledby', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    const heading = screen.getByRole('heading', { name: 'Assessments' });
    expect(heading).toHaveAttribute('id', 'assessments-heading');
    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'assessments-heading');
  });

  it('shows empty state with dashed border when no assessments', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    const empty = screen.getByText(/no assessments yet/i).closest('div');
    expect(empty).toHaveClass('border-dashed');
  });

  it('empty state has a Create your first assessment link', () => {
    renderWithIntl(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('link', { name: /create your first assessment/i })).toBeInTheDocument();
  });
});
