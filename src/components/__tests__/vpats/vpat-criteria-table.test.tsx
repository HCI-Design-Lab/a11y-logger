import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';

const mockCriteria = [
  {
    criterion_code: '1.1.1',
    conformance: 'supports' as const,
    remarks: '',
    related_issue_ids: [] as string[],
  },
  {
    criterion_code: '2.1.1',
    conformance: 'not_evaluated' as const,
    remarks: '',
    related_issue_ids: [] as string[],
  },
];

test('renders criterion codes', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
  expect(screen.getByText('1.1.1')).toBeInTheDocument();
  expect(screen.getByText('2.1.1')).toBeInTheDocument();
});

test('renders conformance display values', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
  expect(screen.getByText('Supports')).toBeInTheDocument();
  expect(screen.getByText('Not Evaluated')).toBeInTheDocument();
});

test('in readOnly mode does not render select elements', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

test('groups criteria by principle headings', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
  expect(screen.getByText('Perceivable')).toBeInTheDocument();
  expect(screen.getByText('Operable')).toBeInTheDocument();
});

test('renders criterion names from WCAG metadata', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
  expect(screen.getByText('Non-text Content')).toBeInTheDocument();
  expect(screen.getByText('Keyboard')).toBeInTheDocument();
});
