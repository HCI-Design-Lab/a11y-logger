import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { WcagSelector } from '@/components/issues/wcag-selector';

test('shows selected codes as badges', () => {
  render(<WcagSelector selected={['1.1.1']} onChange={vi.fn()} />);
  // Code appears in both the badge and the list item
  expect(screen.getAllByText('1.1.1').length).toBeGreaterThanOrEqual(1);
});

test('list items show criterion name alongside code', () => {
  render(<WcagSelector selected={[]} onChange={vi.fn()} />);
  expect(screen.getByText('Non-text Content')).toBeInTheDocument();
  expect(screen.getByText('Contrast (Minimum)')).toBeInTheDocument();
});

test('can select a code', () => {
  const onChange = vi.fn();
  render(<WcagSelector selected={[]} onChange={onChange} />);
  // Find the checkbox for 1.1.1 and click it
  const checkbox = screen.getByRole('checkbox', { name: /1\.1\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(['1.1.1']);
}, 15000);

test('can remove a selected code', () => {
  const onChange = vi.fn();
  render(<WcagSelector selected={['1.1.1']} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: /1\.1\.1/i });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith([]);
}, 15000);

test('shows multiple selected codes as badges', () => {
  render(<WcagSelector selected={['1.1.1', '1.4.3']} onChange={vi.fn()} />);
  // Badges shown above the list
  const badges = screen.getAllByText(/1\.1\.1|1\.4\.3/);
  expect(badges.length).toBeGreaterThanOrEqual(2);
});
