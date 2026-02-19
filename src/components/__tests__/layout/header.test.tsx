import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

import { Header } from '@/components/layout/header';

test('renders theme toggle button', () => {
  render(<Header />);
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
});
