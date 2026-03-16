import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { VpatCriteriaTable, type CriterionRow } from '@/components/vpats/vpat-criteria-table';

const rowA: CriterionRow = {
  criterion_code: '1.1.1',
  conformance: 'not_evaluated',
  remarks: '',
  related_issue_ids: [],
};
const rowAA: CriterionRow = {
  criterion_code: '1.4.3',
  conformance: 'supports',
  remarks: 'Good contrast',
  related_issue_ids: ['issue-1'],
};
const rowAAA: CriterionRow = {
  criterion_code: '1.2.6',
  conformance: 'not_applicable',
  remarks: '',
  related_issue_ids: [],
};

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

describe('VpatCriteriaTable', () => {
  it('renders Level A section heading', () => {
    render(<VpatCriteriaTable criteria={[rowA]} />);
    expect(screen.getByText(/table 1: success criteria/i)).toBeInTheDocument();
  });

  it('renders Level AA section heading when AA rows present', () => {
    render(<VpatCriteriaTable criteria={[rowA, rowAA]} />);
    expect(screen.getByText(/table 2: success criteria/i)).toBeInTheDocument();
  });

  it('does not render Level AAA section when no AAA rows present', () => {
    render(<VpatCriteriaTable criteria={[rowA, rowAA]} />);
    expect(screen.queryByText(/table 3: success criteria/i)).not.toBeInTheDocument();
  });

  it('renders Level AAA section heading when AAA rows present', () => {
    render(<VpatCriteriaTable criteria={[rowA, rowAA, rowAAA]} />);
    expect(screen.getByText(/table 3: success criteria/i)).toBeInTheDocument();
  });

  it('shows clickable issues badge for rows with related issues', () => {
    const onIssuesBadgeClick = vi.fn();
    render(<VpatCriteriaTable criteria={[rowAA]} onIssuesBadgeClick={onIssuesBadgeClick} />);
    const badge = screen.getByRole('button', { name: /1 issue/i });
    expect(badge).toBeInTheDocument();
    userEvent.click(badge);
  });

  it('shows non-interactive zero badge for rows with no issues', () => {
    render(<VpatCriteriaTable criteria={[rowA]} />);
    // Should show 0 but not as a button
    expect(screen.getByText('0')).toBeInTheDocument();
    // The 0 should not be a button
    expect(screen.queryByRole('button', { name: /0 issue/i })).not.toBeInTheDocument();
  });

  it('calls onIssuesBadgeClick with criterion code when badge clicked', async () => {
    const onIssuesBadgeClick = vi.fn();
    render(<VpatCriteriaTable criteria={[rowAA]} onIssuesBadgeClick={onIssuesBadgeClick} />);
    await userEvent.click(screen.getByRole('button', { name: /1 issue/i }));
    expect(onIssuesBadgeClick).toHaveBeenCalledWith('1.4.3');
  });

  it('renders criterion codes', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
    expect(screen.getByText('1.1.1')).toBeInTheDocument();
    expect(screen.getByText('2.1.1')).toBeInTheDocument();
  });

  it('renders conformance display values', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
    expect(screen.getByText('Supports')).toBeInTheDocument();
    expect(screen.getByText('Not Evaluated')).toBeInTheDocument();
  });

  it('in readOnly mode does not render select elements', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('groups criteria by level headings', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
    // 1.1.1 is Level A, 2.1.1 is Level A — both in same section
    expect(screen.getByText(/table 1: success criteria/i)).toBeInTheDocument();
  });

  it('renders criterion names from WCAG metadata', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} readOnly />);
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
  });

  it('in edit mode renders select triggers with aria-labels', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Conformance for 1.1.1' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Conformance for 2.1.1' })).toBeInTheDocument();
  });

  it('in edit mode renders textareas with aria-labels', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Remarks for 1.1.1' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Remarks for 2.1.1' })).toBeInTheDocument();
  });

  it('calls onChange with db snake_case value when conformance is changed', () => {
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

  it('renders Generate All button when projectId and onGenerateAll provided', () => {
    const onGenerateAll = vi.fn();
    render(<VpatCriteriaTable criteria={[rowA]} projectId="p1" onGenerateAll={onGenerateAll} />);
    expect(screen.getByRole('button', { name: /generate all/i })).toBeInTheDocument();
  });

  it('does not render Generate All button when readOnly', () => {
    const onGenerateAll = vi.fn();
    render(
      <VpatCriteriaTable criteria={[rowA]} projectId="p1" onGenerateAll={onGenerateAll} readOnly />
    );
    expect(screen.queryByRole('button', { name: /generate all/i })).not.toBeInTheDocument();
  });
});
