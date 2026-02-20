import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TagInput } from '@/components/issues/tag-input';

test('adds tag on Enter key', () => {
  const onChange = vi.fn();
  render(<TagInput tags={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  fireEvent.change(input, { target: { value: 'accessibility' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith(['accessibility']);
});

test('does not add empty tags', () => {
  const onChange = vi.fn();
  render(<TagInput tags={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onChange).not.toHaveBeenCalled();
});

test('does not add duplicate tags', () => {
  const onChange = vi.fn();
  render(<TagInput tags={['accessibility']} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  fireEvent.change(input, { target: { value: 'accessibility' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onChange).not.toHaveBeenCalled();
});

test('removes tag on click', () => {
  const onChange = vi.fn();
  render(<TagInput tags={['accessibility', 'forms']} onChange={onChange} />);
  const removeButtons = screen.getAllByRole('button');
  // Click the first remove button (for 'accessibility')
  fireEvent.click(removeButtons[0]);
  expect(onChange).toHaveBeenCalledWith(['forms']);
});

test('renders existing tags', () => {
  render(<TagInput tags={['a11y', 'wcag']} onChange={vi.fn()} />);
  expect(screen.getByText('a11y')).toBeInTheDocument();
  expect(screen.getByText('wcag')).toBeInTheDocument();
});
