import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="rich-text-editor">
      <div data-testid="editor-value">{value}</div>
      <button onClick={() => onChange('<p>New text</p>')}>trigger-change</button>
    </div>
  ),
}));

import { ExecutiveSummarySection } from '@/components/reports/report-section-executive-summary';

describe('ExecutiveSummarySection', () => {
  it('renders the rich text editor with current value', () => {
    render(
      <ExecutiveSummarySection
        body="<p>Current summary</p>"
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    expect(screen.getByTestId('editor-value')).toHaveTextContent('Current summary');
  });

  it('calls onChange when editor changes', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'trigger-change' }));
    expect(onChange).toHaveBeenCalledWith('<p>New text</p>');
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

  it('shows generating overlay when isGenerating is true', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Generating with AI...')).toBeInTheDocument();
  });

  it('does not show generating overlay when isGenerating is false', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Generating with AI...')).not.toBeInTheDocument();
  });

  it('disables delete button while generating', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('marks fields inert while generating', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByTestId('section-fields')).toHaveAttribute('inert', '');
  });

  it('does not mark fields inert when not generating', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByTestId('section-fields')).not.toHaveAttribute('inert');
  });

  it('generate button uses ai variant', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByRole('button', { name: /generate/i })).toHaveAttribute('data-variant', 'ai');
  });

  it('delete button uses destructive variant', () => {
    render(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toHaveAttribute(
      'data-variant',
      'destructive'
    );
  });
});
