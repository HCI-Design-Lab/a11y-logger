import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/components/issues/wcag-selector', () => ({
  WcagSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="wcag-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/section508-selector', () => ({
  Section508Selector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="section508-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/eu-selector', () => ({
  EuSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="eu-selector" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/tag-input', () => ({
  TagInput: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="tag-input" data-disabled={disabled ? 'true' : undefined} />
  ),
}));
vi.mock('@/components/issues/media-uploader', () => ({
  MediaUploader: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="media-uploader" data-disabled={disabled ? 'true' : undefined} />
  ),
}));

import { IssueForm } from '../issue-form';

const messages = {
  issues: {
    form: {
      title_label: 'Title',
      title_placeholder: 'e.g. Image missing alt text',
      description_label: 'Description',
      description_placeholder: 'Describe the accessibility issue',
      severity_label: 'Severity',
      severity_options: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      user_impact_label: 'User Impact',
      user_impact_placeholder:
        'Describe how this issue affects users, particularly those with disabilities',
      url_label: 'URL',
      url_placeholder: 'https://example.com/page',
      selector_label: 'Selector',
      selector_placeholder: 'e.g. #search-button',
      code_snippet_label: 'Code Snippet',
      suggested_fix_label: 'Suggested Fix',
      environment_heading: 'Environment',
      device_type_label: 'Device Type',
      device_type_options: {
        none: 'None',
        desktop: 'Desktop',
        mobile: 'Mobile',
        tablet: 'Tablet',
      },
      browser_label: 'Browser',
      browser_placeholder: 'e.g. Chrome 121',
      os_label: 'Operating System',
      os_placeholder: 'e.g. macOS 14',
      at_label: 'Assistive Technology',
      at_placeholder: 'e.g. VoiceOver, NVDA',
      assessment_label: 'Assessment',
      assessment_placeholder: 'Select an assessment…',
      tags_label: 'Tags',
      status_label: 'Status',
      status_options: {
        open: 'Open',
        resolved: 'Resolved',
        wont_fix: "Won't Fix",
      },
      save_button: 'Save Issue',
      save_button_loading: 'Saving…',
      cancel_button: 'Cancel',
    },
    attachments: {
      heading: 'Screenshots & Videos',
      ai_status_message: 'Generating issue with AI. Please wait.',
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

describe('IssueForm i18n', () => {
  it('renders Title label from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByText(/^Title/)).toBeInTheDocument();
  });

  it('renders title placeholder from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. Image missing alt text')).toBeInTheDocument();
  });

  it('renders Environment heading from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByText('Environment')).toBeInTheDocument();
  });

  it('renders Save Issue button from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save issue/i })).toBeInTheDocument();
  });

  it('renders description placeholder from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Describe the accessibility issue')).toBeInTheDocument();
  });

  it('renders Screenshots & Videos heading from translations', () => {
    renderWithIntl(<IssueForm projectId="p1" onSubmit={vi.fn()} />);
    expect(screen.getByText('Screenshots & Videos')).toBeInTheDocument();
  });
});
