import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopRisksSection } from '@/components/reports/report-section-top-risks';

describe('TopRisksSection', () => {
  it('renders 5 numbered inputs', () => {
    render(
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
    render(
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
    render(
      <TopRisksSection
        items={['A', 'B']}
        onChange={onChange}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Updated' } });
    expect(onChange).toHaveBeenCalledWith(['Updated', 'B', '', '', '']);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
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
    render(
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
});
