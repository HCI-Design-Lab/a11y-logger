import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EuSelector } from '@/components/issues/eu-selector';

test('shows selected codes as badges', () => {
  render(<EuSelector selected={['4.2.1']} onChange={vi.fn()} />);
  expect(screen.getAllByText('4.2.1').length).toBeGreaterThanOrEqual(1);
});

test('list items show criterion name alongside code', () => {
  render(<EuSelector selected={[]} onChange={vi.fn()} />);
  expect(screen.getByText('Usage without vision')).toBeInTheDocument();
  expect(screen.getByText('Biometrics')).toBeInTheDocument();
});

test('can select a code', () => {
  const onChange = vi.fn();
  render(<EuSelector selected={[]} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: '4.2.1' });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(['4.2.1']);
});

test('can remove a selected code', () => {
  const onChange = vi.fn();
  render(<EuSelector selected={['4.2.1']} onChange={onChange} />);
  const checkbox = screen.getByRole('checkbox', { name: '4.2.1' });
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith([]);
});
