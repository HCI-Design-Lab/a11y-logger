import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveSummarySection } from '@/components/reports/report-section-executive-summary';

describe('ExecutiveSummarySection', () => {
  it('renders textarea with current value', () => {
    render(
      <ExecutiveSummarySection
        body="Current summary"
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByDisplayValue('Current summary')).toBeInTheDocument();
  });

  it('calls onChange when textarea changes', () => {
    const onChange = vi.fn();
    render(
      <ExecutiveSummarySection
        body=""
        onChange={onChange}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });
    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('calls onDelete when trash icon clicked', () => {
    const onDelete = vi.fn();
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={onDelete}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('disables generate button while generating', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByRole('button', { name: /generat/i })).toBeDisabled();
  });
});
