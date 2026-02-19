import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}));

import { Header } from '@/components/layout/header';

test('renders theme toggle button', () => {
  render(<Header />);
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
});

test('clicking theme toggle calls setTheme with opposite theme', () => {
  render(<Header />);
  fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
  expect(mockSetTheme).toHaveBeenCalledWith('light');
});
