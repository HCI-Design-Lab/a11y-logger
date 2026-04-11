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

  it('Save button is always enabled regardless of provider selection', () => {
    render(<AIConfigSection provider="" onSave={onSave} />);
    expect(screen.getByRole('button', { name: 'Save Configuration' })).not.toBeDisabled();
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

  it('Save button remains enabled even when provider is from env', () => {
    render(<AIConfigSection provider="none" onSave={onSave} envSource={envSource} />);
    expect(screen.getByRole('button', { name: 'Save Configuration' })).not.toBeDisabled();
  });

  it('shows "Set via environment variable" for API key when apiKey is from env', () => {
    render(<AIConfigSection provider="anthropic" onSave={onSave} envSource={envSource} />);
    expect(screen.getByText(/set via environment variable/i)).toBeInTheDocument();
  });

  it('shows env override banner when model is from env', () => {
    render(
      <AIConfigSection
        provider="ollama"
        onSave={onSave}
        envSource={{ provider: null, apiKey: false, model: 'llama3.2', baseUrl: null }}
      />
    );
    // The per-task model selectors are shown; the env banner is shown because model is set
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
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

describe('AIConfigSection — API key visibility toggle', () => {
  it('toggles API key visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<AIConfigSection provider="openai" onSave={onSave} apiKey="sk-test" />);
    const keyInput = screen.getByPlaceholderText('sk-...');
    expect(keyInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show api key/i }));
    expect(keyInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /hide api key/i }));
    expect(keyInput).toHaveAttribute('type', 'password');
  });

  it('updates API key value when typed', async () => {
    const user = userEvent.setup();
    render(<AIConfigSection provider="openai" onSave={onSave} />);
    const keyInput = screen.getByPlaceholderText('sk-...');
    await user.clear(keyInput);
    await user.type(keyInput, 'sk-newkey');
    expect(keyInput).toHaveValue('sk-newkey');
  });
});

describe('AIConfigSection — openai-compatible provider', () => {
  it('shows openai-compatible description paragraph', () => {
    render(<AIConfigSection provider="openai-compatible" onSave={onSave} />);
    expect(screen.getByText(/any api that follows the openai chat format/i)).toBeInTheDocument();
  });

  it('shows optional label for API key with openai-compatible', () => {
    render(<AIConfigSection provider="openai-compatible" onSave={onSave} />);
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });

  it('shows base URL input for openai-compatible', () => {
    render(<AIConfigSection provider="openai-compatible" onSave={onSave} />);
    expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
  });
});

describe('AIConfigSection — base URL input', () => {
  it('shows editable base URL for ollama without env override', async () => {
    const user = userEvent.setup();
    render(<AIConfigSection provider="ollama" onSave={onSave} baseUrl="" />);
    const input = screen.getByLabelText(/base url/i);
    expect(input).not.toBeDisabled();
    await user.type(input, 'http://localhost:11434/v1');
    expect(input).toHaveValue('http://localhost:11434/v1');
  });
});

describe('AIConfigSection — TaskModelSelector', () => {
  it('renders with custom model value showing Other text input (isCustomValue path)', () => {
    // When a model value is set that isn't in the known models list,
    // the component initializes with showOther=true, revealing the custom text input.
    render(<AIConfigSection provider="openai" onSave={onSave} modelIssues="my-custom-model" />);
    expect(screen.getByDisplayValue('my-custom-model')).toBeInTheDocument();
    expect(screen.getByLabelText(/issue analysis custom model name/i)).toBeInTheDocument();
  });

  it('renders without custom input when model is a known value', () => {
    render(<AIConfigSection provider="openai" onSave={onSave} modelIssues="gpt-4o" />);
    expect(screen.queryByLabelText(/issue analysis custom model name/i)).not.toBeInTheDocument();
  });

  it('shows custom inputs for multiple tasks when all have unknown models', () => {
    render(
      <AIConfigSection
        provider="openai"
        onSave={onSave}
        modelIssues="custom-issues"
        modelVpat="custom-vpat"
        modelReports="custom-reports"
      />
    );
    expect(screen.getByDisplayValue('custom-issues')).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom-vpat')).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom-reports')).toBeInTheDocument();
  });

  it('saves custom model value via text input', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockResolvedValue(undefined);
    render(<AIConfigSection provider="openai" onSave={mockSave} modelIssues="my-custom-model" />);
    const customInput = screen.getByLabelText(/issue analysis custom model name/i);
    await user.clear(customInput);
    await user.type(customInput, 'new-custom');
    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ modelIssues: 'new-custom' }));
    });
  });
});

describe('AIConfigSection — review pass initially enabled', () => {
  it('shows review model selector when reviewPassEnabled starts true', () => {
    render(<AIConfigSection provider="openai" onSave={onSave} reviewPassEnabled={true} />);
    expect(screen.getByLabelText(/ai review pass model/i)).toBeInTheDocument();
  });
});

describe('AIConfigSection — per-task model selectors', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);

  it('shows task model section when provider is openai', () => {
    render(
      <AIConfigSection
        provider="openai"
        onSave={onSave}
        modelIssues=""
        modelVpat=""
        modelReports=""
        modelVpatReview=""
        reviewPassEnabled={false}
      />
    );
    expect(screen.getByText('Issue Analysis')).toBeInTheDocument();
    expect(screen.getByText('VPAT Generation')).toBeInTheDocument();
    expect(screen.getByText('Report Writing')).toBeInTheDocument();
    expect(screen.getByText('AI Review Pass')).toBeInTheDocument();
  });

  it('does not show review model selector when toggle is off', () => {
    render(
      <AIConfigSection
        provider="openai"
        onSave={onSave}
        modelIssues=""
        modelVpat=""
        modelReports=""
        modelVpatReview=""
        reviewPassEnabled={false}
      />
    );
    expect(screen.queryByLabelText(/ai review pass model/i)).not.toBeInTheDocument();
  });

  it('shows review model selector when toggle is switched on', async () => {
    const user = userEvent.setup();
    render(
      <AIConfigSection
        provider="openai"
        onSave={onSave}
        modelIssues=""
        modelVpat=""
        modelReports=""
        modelVpatReview=""
        reviewPassEnabled={false}
      />
    );
    await user.click(screen.getByRole('switch', { name: /enable ai review pass/i }));
    expect(screen.getByLabelText(/ai review pass model/i)).toBeInTheDocument();
  });

  it('calls onSave with all model fields and reviewPassEnabled', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockResolvedValue(undefined);
    render(
      <AIConfigSection
        provider="openai"
        onSave={mockSave}
        modelIssues="gpt-4o"
        modelVpat="gpt-4o-mini"
        modelReports=""
        modelVpatReview=""
        reviewPassEnabled={true}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Save Configuration' }));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          modelIssues: 'gpt-4o',
          modelVpat: 'gpt-4o-mini',
          modelReports: '',
          modelVpatReview: '',
          reviewPassEnabled: true,
        })
      );
    });
  });

  it('hides task model section when provider is none', () => {
    render(
      <AIConfigSection
        provider="none"
        onSave={onSave}
        modelIssues=""
        modelVpat=""
        modelReports=""
        modelVpatReview=""
        reviewPassEnabled={false}
      />
    );
    expect(screen.queryByText('Issue Analysis')).not.toBeInTheDocument();
  });
});
