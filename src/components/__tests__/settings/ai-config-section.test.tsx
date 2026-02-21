import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AIConfigSection } from '@/components/settings/ai-config-section';

test('renders provider select', () => {
  render(<AIConfigSection onSave={vi.fn()} />);
  expect(screen.getByLabelText(/ai provider/i)).toBeInTheDocument();
});

test('renders API key input as password type', () => {
  render(<AIConfigSection onSave={vi.fn()} />);
  // Query by the label element's association (not aria-label on the toggle button)
  const label = screen.getByText('API Key');
  const input = document.getElementById(label.getAttribute('for') ?? 'api-key');
  expect(input).toHaveAttribute('type', 'password');
});

test('has show/hide toggle for API key', () => {
  render(<AIConfigSection onSave={vi.fn()} />);
  expect(screen.getByRole('button', { name: /show|hide/i })).toBeInTheDocument();
});
