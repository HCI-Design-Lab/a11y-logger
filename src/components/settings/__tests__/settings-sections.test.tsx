/**
 * i18n integration tests for settings section components.
 * Each section must render its heading from translations via NextIntlClientProvider.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock fetch globally for components that call APIs
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { AIConfigSection } from '../ai-config-section';
import { AuthToggleSection } from '../auth-toggle-section';
import { UserManagementSection } from '../user-management-section';
import { DataManagementSection } from '../data-management-section';

const messages = {
  settings: {
    ai: {
      heading: 'AI Configuration',
      provider_label: 'AI Provider',
      provider_none: 'None (disable AI features)',
      provider_openai: 'OpenAI',
      provider_anthropic: 'Anthropic',
      api_key_label: 'API Key',
      api_key_placeholder: 'sk-...',
      model_label: 'Model',
      base_url_label: 'Base URL',
      base_url_placeholder: 'https://api.example.com/v1',
      ollama_base_url_placeholder: 'http://localhost:11434/v1',
      save_button: 'Save AI Settings',
      save_button_loading: 'Saving…',
    },
    auth: {
      heading: 'Authentication',
      enable_label: 'Enable authentication',
      enable_description: 'Require a password to access this instance',
      save_button: 'Save Auth Settings',
      updating_label: 'Updating…',
      enable_button: 'Enable Auth',
      disable_button: 'Disable Auth',
    },
    users: {
      heading: 'User Management',
      create_account_heading: 'Create Account',
      username_label: 'Username',
      password_label: 'Password',
      new_password_label: 'New Password',
      create_button: 'Create Account',
    },
    data: {
      heading: 'Data Management',
      danger_zone_heading: 'Danger Zone',
      export_button: 'Export Data',
      import_button: 'Import Data',
      clear_button: 'Clear All Data',
      clear_dialog_title: 'Clear All Data?',
      clear_dialog_description:
        'This will permanently delete all projects, assessments, issues, reports, and VPATs. This cannot be undone.',
      clear_dialog_confirm: 'Clear All Data',
      clear_dialog_cancel: 'Cancel',
    },
    toast: {
      ai_saved: 'AI settings saved',
      ai_save_failed: 'Failed to save AI settings',
      auth_saved: 'Auth settings saved',
      auth_save_failed: 'Failed to save auth settings',
      language_saved: 'Language updated',
      language_save_failed: 'Failed to update language',
      data_reset_success: 'Data reset successfully',
      data_reset_failed: 'Failed to reset data',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('AIConfigSection — i18n integration', () => {
  it('renders the AI Configuration heading from translations', () => {
    renderWithIntl(<AIConfigSection onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText('AI Configuration')).toBeInTheDocument();
  });

  it('renders the Save AI Settings button from translations', () => {
    renderWithIntl(<AIConfigSection onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole('button', { name: 'Save AI Settings' })).toBeInTheDocument();
  });

  it('renders the AI Provider label from translations', () => {
    renderWithIntl(<AIConfigSection onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
  });
});

describe('AuthToggleSection — i18n integration', () => {
  it('renders the Authentication heading from translations', () => {
    renderWithIntl(<AuthToggleSection authEnabled={false} hasUsers={true} />);
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });
});

describe('UserManagementSection — i18n integration', () => {
  it('renders the User Management card title from translations', () => {
    renderWithIntl(<UserManagementSection users={[]} />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders the Create Account heading from translations when no users exist', () => {
    renderWithIntl(<UserManagementSection users={[]} />);
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('renders the Username label from translations', () => {
    renderWithIntl(<UserManagementSection users={[]} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders the Create Account button from translations', () => {
    renderWithIntl(<UserManagementSection users={[]} />);
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });
});

describe('DataManagementSection — i18n integration', () => {
  it('renders the Data Management heading from translations', () => {
    renderWithIntl(<DataManagementSection dbPath="/data/db.sqlite" mediaPath="/data/media" />);
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });

  it('renders the Danger Zone heading from translations', () => {
    renderWithIntl(<DataManagementSection dbPath="/data/db.sqlite" mediaPath="/data/media" />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders the Clear All Data button from translations', () => {
    renderWithIntl(<DataManagementSection dbPath="/data/db.sqlite" mediaPath="/data/media" />);
    expect(screen.getByRole('button', { name: 'Clear All Data' })).toBeInTheDocument();
  });

  it('renders the Export Data button from translations', () => {
    renderWithIntl(<DataManagementSection dbPath="/data/db.sqlite" mediaPath="/data/media" />);
    expect(screen.getByRole('button', { name: 'Export Data' })).toBeInTheDocument();
  });

  it('renders the Import Data button from translations', () => {
    renderWithIntl(<DataManagementSection dbPath="/data/db.sqlite" mediaPath="/data/media" />);
    expect(screen.getByRole('button', { name: 'Import Data' })).toBeInTheDocument();
  });
});
