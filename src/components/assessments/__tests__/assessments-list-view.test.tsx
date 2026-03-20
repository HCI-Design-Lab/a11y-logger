import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/assessments/all-assessments-table', () => ({
  AllAssessmentsTable: () => <div data-testid="assessments-table" />,
}));
vi.mock('@/components/assessments/assessment-card', () => ({
  AssessmentCard: () => <div data-testid="assessment-card" />,
}));

import { AssessmentsListView } from '../assessments-list-view';

describe('AssessmentsListView layout', () => {
  it('renders the New Assessment link', () => {
    render(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('link', { name: /new assessment/i })).toBeInTheDocument();
  });

  it('ViewToggle is not in the header row with the New Assessment button', () => {
    render(<AssessmentsListView assessments={[]} />);
    const heading = screen.getByRole('heading', { name: 'Assessments' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).not.toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    render(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });
});
