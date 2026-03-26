import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ViewToggle } from '../view-toggle';

describe('ViewToggle', () => {
  it('has role=group and accessible label', () => {
    render(<ViewToggle view="table" onViewChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });

  it('marks table button as pressed when view is table', () => {
    render(<ViewToggle view="table" onViewChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('marks grid button as pressed when view is grid', () => {
    render(<ViewToggle view="grid" onViewChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls onViewChange with grid when grid button is clicked', () => {
    const onChange = vi.fn();
    render(<ViewToggle view="table" onViewChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onViewChange with table when table button is clicked', () => {
    const onChange = vi.fn();
    render(<ViewToggle view="grid" onViewChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(onChange).toHaveBeenCalledWith('table');
  });

  it('uses Table icon for table view button', () => {
    render(<ViewToggle view="table" onViewChange={vi.fn()} />);
    // Table icon renders an SVG inside the table button
    const tableBtn = screen.getByRole('button', { name: 'Table view' });
    expect(tableBtn.querySelector('svg')).toBeInTheDocument();
  });

  it('uses LayoutGrid icon for grid view button', () => {
    render(<ViewToggle view="grid" onViewChange={vi.fn()} />);
    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    expect(gridBtn.querySelector('svg')).toBeInTheDocument();
  });
});
