import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserImpactSection } from '@/components/reports/report-section-user-impact';

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
    render(
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
    render(
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
    render(
      <UserImpactSection
        data={EMPTY}
        onChange={onChange}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'New value' } });
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, screen_reader: 'New value' });
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
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
    render(
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
});
