import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AIConfigSection } from '@/components/settings/ai-config-section';

test('renders provider select', () => {
  render(<AIConfigSection onSave={vi.fn()} />);
  expect(screen.getByLabelText(/ai provider/i)).toBeInTheDocument();
});

test('renders API key input as password type when a cloud provider is selected', () => {
  render(<AIConfigSection provider="openai" onSave={vi.fn()} />);
  const label = screen.getByText('API Key');
  const input = document.getElementById(label.getAttribute('for') ?? 'api-key');
  expect(input).toHaveAttribute('type', 'password');
});

test('has show/hide toggle for API key when a cloud provider is selected', () => {
  render(<AIConfigSection provider="openai" onSave={vi.fn()} />);
  expect(screen.getByRole('button', { name: /show|hide/i })).toBeInTheDocument();
});

test('toggles API key visibility when show/hide button is clicked', () => {
  render(<AIConfigSection provider="openai" apiKey="sk-test" onSave={vi.fn()} />);
  const input = screen.getByPlaceholderText(/sk-/i);
  expect(input).toHaveAttribute('type', 'password');

  fireEvent.click(screen.getByRole('button', { name: /show api key/i }));
  expect(input).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: /hide api key/i })).toBeInTheDocument();
});

test('calls onSave with selected provider, api key, model, and baseUrl when save button clicked', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<AIConfigSection provider="openai" apiKey="sk-test123" onSave={onSave} />);

  fireEvent.click(screen.getByRole('button', { name: /save configuration/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      provider: 'openai',
      apiKey: 'sk-test123',
      model: '',
      baseUrl: '',
    });
  });
});

test('does not render API key field when provider is none', () => {
  render(<AIConfigSection provider="none" onSave={vi.fn()} />);
  expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
});

test('renders base URL and model fields for ollama provider', () => {
  render(<AIConfigSection provider="ollama" onSave={vi.fn()} />);
  expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/model name/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
});

test('renders all fields for openai-compatible provider', () => {
  render(<AIConfigSection provider="openai-compatible" onSave={vi.fn()} />);
  expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/model name/i)).toBeInTheDocument();
  expect(screen.getByText('API Key')).toBeInTheDocument();
});
