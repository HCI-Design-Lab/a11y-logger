import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { UserImpactSection } from '@/components/reports/report-section-user-impact';

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

const EMPTY = {
  screen_reader: '',
  low_vision: '',
  color_vision: '',
  keyboard_only: '',
  cognitive: '',
  deaf_hard_of_hearing: '',
};

describe('UserImpactSection', () => {
  it('renders 6 labeled textareas', () => {
    renderWithIntl(
      <UserImpactSection
        data={EMPTY}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('renders existing data', () => {
    renderWithIntl(
      <UserImpactSection
        data={{ ...EMPTY, screen_reader: 'Has issues' }}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByDisplayValue('Has issues')).toBeInTheDocument();
  });

  it('calls onChange with updated field', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <UserImpactSection
        data={EMPTY}
        onChange={onChange}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0]!, { target: { value: 'New value' } });
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, screen_reader: 'New value' });
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    renderWithIntl(
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={{
          screen_reader: '',
          low_vision: '',
          color_vision: '',
          keyboard_only: '',
          cognitive: '',
          deaf_hard_of_hearing: '',
        }}
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
      <UserImpactSection
        data={{
          screen_reader: '',
          low_vision: '',
          color_vision: '',
          keyboard_only: '',
          cognitive: '',
          deaf_hard_of_hearing: '',
        }}
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
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={EMPTY}
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
      <UserImpactSection
        data={EMPTY}
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
