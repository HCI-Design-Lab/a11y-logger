import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

test('toggles API key visibility when show/hide button is clicked', () => {
  render(<AIConfigSection onSave={vi.fn()} apiKey="sk-test" />);
  const input = screen.getByPlaceholderText(/sk-/i);
  expect(input).toHaveAttribute('type', 'password');

  fireEvent.click(screen.getByRole('button', { name: /show api key/i }));
  expect(input).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: /hide api key/i })).toBeInTheDocument();
});

test('calls onSave with selected provider and api key when save button clicked', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<AIConfigSection provider="openai" apiKey="sk-test123" onSave={onSave} />);

  fireEvent.click(screen.getByRole('button', { name: /save configuration/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({ provider: 'openai', apiKey: 'sk-test123' });
  });
});
