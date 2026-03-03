import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/ui/view-toggle';

describe('ViewToggle', () => {
  it('renders both toggle buttons', () => {
    render(<ViewToggle view="table" onViewChange={() => {}} />);
    expect(screen.getByRole('button', { name: /table view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument();
  });

  it('calls onViewChange with grid when grid button clicked', async () => {
    const onViewChange = vi.fn();
    render(<ViewToggle view="table" onViewChange={onViewChange} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(onViewChange).toHaveBeenCalledWith('grid');
  });

  it('calls onViewChange with table when table button clicked', async () => {
    const onViewChange = vi.fn();
    render(<ViewToggle view="grid" onViewChange={onViewChange} />);
    await userEvent.click(screen.getByRole('button', { name: /table view/i }));
    expect(onViewChange).toHaveBeenCalledWith('table');
  });

  it('marks the active view button as pressed', () => {
    render(<ViewToggle view="table" onViewChange={() => {}} />);
    expect(screen.getByRole('button', { name: /table view/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /grid view/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
