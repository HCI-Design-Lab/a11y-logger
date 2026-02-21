import { render, screen, fireEvent } from '@testing-library/react';
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

test('in edit mode renders select triggers with aria-labels', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} />);
  expect(screen.getByRole('combobox', { name: 'Conformance for 1.1.1' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Conformance for 2.1.1' })).toBeInTheDocument();
});

test('in edit mode renders textareas with aria-labels', () => {
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} />);
  expect(screen.getByRole('textbox', { name: 'Remarks for 1.1.1' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Remarks for 2.1.1' })).toBeInTheDocument();
});

test('calls onChange with db snake_case value when conformance is changed', () => {
  const handleChange = vi.fn();
  render(<VpatCriteriaTable criteria={mockCriteria} onChange={handleChange} />);

  const select = screen.getByRole('combobox', { name: 'Conformance for 1.1.1' });
  fireEvent.click(select);

  const option = screen.getByRole('option', { name: 'Does Not Support' });
  fireEvent.click(option);

  expect(handleChange).toHaveBeenCalled();
  const updatedCriteria: { criterion_code: string; conformance: string }[] =
    handleChange.mock.calls[handleChange.mock.calls.length - 1]![0];
  const row = updatedCriteria.find((r) => r.criterion_code === '1.1.1')!;
  expect(row?.conformance).toBe('does_not_support');
});
