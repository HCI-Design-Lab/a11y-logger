import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIConfigSection } from '../ai-config-section';

const onSave = vi.fn().mockResolvedValue(undefined);

describe('AIConfigSection — None provider', () => {
  it('Save button is enabled when provider is None', async () => {
    render(<AIConfigSection provider="none" onSave={onSave} />);
    expect(screen.getByRole('button', { name: 'Save Configuration' })).not.toBeDisabled();
  });

  it('Save button is disabled when no provider is selected', () => {
    render(<AIConfigSection provider="" onSave={onSave} />);
    expect(screen.getByRole('button', { name: 'Save Configuration' })).toBeDisabled();
  });

  it('calls onSave with provider=none when None is saved', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockResolvedValue(undefined);
    render(<AIConfigSection provider="none" onSave={mockSave} />);
    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ provider: 'none' }));
    });
  });

  it('hides API key, base URL, and model fields when None is selected', () => {
    render(<AIConfigSection provider="none" onSave={onSave} />);
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/base url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/model name/i)).not.toBeInTheDocument();
  });
});

describe('AIConfigSection — env var overrides', () => {
  const envSource = {
    provider: 'anthropic',
    apiKey: true,
    model: null,
    baseUrl: null,
  };

  it('shows info banner when provider is from env', () => {
    render(<AIConfigSection provider="none" onSave={onSave} envSource={envSource} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText(/environment variable/i)).toBeInTheDocument();
  });

  it('does not show banner when no env source is set', () => {
    render(<AIConfigSection provider="openai" onSave={onSave} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables Save button when provider is from env', () => {
    render(<AIConfigSection provider="none" onSave={onSave} envSource={envSource} />);
    expect(screen.getByRole('button', { name: 'Save Configuration' })).toBeDisabled();
  });

  it('shows "Set via environment variable" for API key when apiKey is from env', () => {
    render(<AIConfigSection provider="anthropic" onSave={onSave} envSource={envSource} />);
    expect(screen.getByText(/set via environment variable/i)).toBeInTheDocument();
  });

  it('shows env model value in model field when model is from env', () => {
    render(
      <AIConfigSection
        provider="ollama"
        onSave={onSave}
        envSource={{ provider: null, apiKey: false, model: 'llama3.2', baseUrl: null }}
      />
    );
    const modelInput = screen.getByLabelText(/model name/i);
    expect(modelInput).toHaveValue('llama3.2');
    expect(modelInput).toBeDisabled();
  });

  it('shows env baseUrl value in base URL field when baseUrl is from env', () => {
    render(
      <AIConfigSection
        provider="ollama"
        onSave={onSave}
        envSource={{
          provider: null,
          apiKey: false,
          model: null,
          baseUrl: 'http://localhost:11434/v1',
        }}
      />
    );
    const baseUrlInput = screen.getByLabelText(/base url/i);
    expect(baseUrlInput).toHaveValue('http://localhost:11434/v1');
    expect(baseUrlInput).toBeDisabled();
  });
});
