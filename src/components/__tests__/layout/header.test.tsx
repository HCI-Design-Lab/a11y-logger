import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}));

import { Header } from '@/components/layout/header';

test('renders app wordmark', () => {
  render(<Header />);
  expect(screen.getByText('A11y Logger')).toBeInTheDocument();
});

test('renders logo icon with aria-hidden', () => {
  render(<Header />);
  const svg = document.querySelector('svg[aria-hidden="true"]');
  expect(svg).toBeInTheDocument();
});

test('renders theme toggle button', () => {
  render(<Header />);
  expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
});

test('clicking theme toggle calls setTheme with opposite theme', () => {
  render(<Header />);
  fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
  expect(mockSetTheme).toHaveBeenCalledWith('light');
});

test('theme toggle indicates current pressed state', () => {
  render(<Header />);
  // theme is 'dark' in mock, so aria-pressed should be true
  expect(screen.getByRole('button', { name: /switch to light mode/i })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
