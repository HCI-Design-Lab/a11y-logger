import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Section508Selector } from '@/components/issues/section508-selector';

test('shows selected codes as badges', () => {
  render(<Section508Selector selected={['302.1']} onChange={vi.fn()} />);
  expect(screen.getAllByText('302.1').length).toBeGreaterThanOrEqual(1);
});

test('list items show criterion name alongside code', () => {
  render(<Section508Selector selected={[]} onChange={vi.fn()} />);
  expect(screen.getByText('Without Vision')).toBeInTheDocument();
  expect(screen.getByText('Object Information')).toBeInTheDocument();
});

test('can select a code', () => {
  const onChange = vi.fn();
  render(<Section508Selector selected={[]} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: /302\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(['302.1']);
});

test('can remove a selected code', () => {
  const onChange = vi.fn();
  render(<Section508Selector selected={['302.1']} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: /302\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith([]);
});
