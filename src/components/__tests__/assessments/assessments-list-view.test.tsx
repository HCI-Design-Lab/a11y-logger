import { render, screen } from '@testing-library/react';
import { AssessmentsListView } from '@/components/assessments/assessments-list-view';

test('renders New Assessment button linking to /assessments/new', () => {
  render(<AssessmentsListView assessments={[]} />);
  const link = screen.getByRole('link', { name: /new assessment/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/assessments/new');
});
