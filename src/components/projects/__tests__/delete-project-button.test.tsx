import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Mock fetch
global.fetch = vi.fn();

import { DeleteProjectButton } from '@/components/projects/delete-project-button';

test('renders delete button', () => {
  render(<DeleteProjectButton projectId="1" projectName="Test Project" />);
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('shows project name in confirmation dialog', async () => {
  render(<DeleteProjectButton projectId="1" projectName="My Project" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByText(/my project/i)).toBeInTheDocument();
});
