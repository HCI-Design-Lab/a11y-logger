import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { WcagSelector } from '@/components/issues/wcag-selector';

test('shows selected codes as badges', () => {
  render(<WcagSelector selected={['1.1.1']} onChange={vi.fn()} />);
  // There will be at least one element showing '1.1.1' (as a badge)
  const matches = screen.getAllByText('1.1.1');
  expect(matches.length).toBeGreaterThanOrEqual(1);
});

test('can select a code', () => {
  const onChange = vi.fn();
  render(<WcagSelector selected={[]} onChange={onChange} />);
  // Find the checkbox for 1.1.1 and click it
  const checkbox = screen.getByRole('checkbox', { name: /1\.1\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(['1.1.1']);
});

test('can remove a selected code', () => {
  const onChange = vi.fn();
  render(<WcagSelector selected={['1.1.1']} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: /1\.1\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith([]);
});

test('shows multiple selected codes as badges', () => {
  render(<WcagSelector selected={['1.1.1', '1.4.3']} onChange={vi.fn()} />);
  // Badges shown above the list
  const badges = screen.getAllByText(/1\.1\.1|1\.4\.3/);
  expect(badges.length).toBeGreaterThanOrEqual(2);
});
