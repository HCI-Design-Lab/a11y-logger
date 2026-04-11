import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { TopRisksSection } from '@/components/reports/report-section-top-risks';

const messages = {
  reports: {
    sections: {
      executive_summary_title: 'Executive Summary',
      executive_summary_add: 'Add Executive Summary',
      top_risks_title: 'Top Risks',
      top_risks_add: 'Add Top Risks',
      quick_wins_title: 'Quick Wins',
      quick_wins_add: 'Add Quick Wins',
      user_impact_title: 'User Impact',
      user_impact_add: 'Add User Impact',
      generate_button: 'Generate',
      generating_label: 'Generating…',
      generating_overlay: 'Generating with AI...',
      delete_button: 'Delete',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('TopRisksSection', () => {
  it('renders 5 numbered inputs', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(5);
  });

  it('renders existing items', () => {
    renderWithIntl(
      <TopRisksSection
        items={['Risk A']}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByDisplayValue('Risk A')).toBeInTheDocument();
  });

  it('calls onChange with updated array when item changed', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <TopRisksSection
        items={['A', 'B']}
        onChange={onChange}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0]!, { target: { value: 'Updated' } });
    expect(onChange).toHaveBeenCalledWith(['Updated', 'B', '', '', '']);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    renderWithIntl(
      <TopRisksSection
        items={[]}
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
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByRole('button', { name: /generat/i })).toBeDisabled();
  });

  it('shows generating overlay when isGenerating is true', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
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
    renderWithIntl(
      <TopRisksSection
        items={[]}
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
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('marks fields inert while generating', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={true}
      />
    );
    expect(screen.getByTestId('section-fields')).toHaveAttribute('inert', '');
  });

  it('does not mark fields inert when not generating', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByTestId('section-fields')).not.toHaveAttribute('inert');
  });

  it('generate button uses ai variant', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByRole('button', { name: /generate/i })).toHaveAttribute('data-variant', 'ai');
  });

  it('delete button uses destructive variant', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
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
