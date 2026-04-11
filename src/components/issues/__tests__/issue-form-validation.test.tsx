import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { IssueForm } from '@/components/issues/issue-form';
import type { Issue } from '@/lib/db/issues';

const messages = {
  issues: {
    form: {
      title_label: 'Title',
      title_placeholder: 'e.g. Image missing alt text',
      description_label: 'Description',
      description_placeholder: 'Describe the accessibility issue',
      severity_label: 'Severity',
      severity_options: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
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
      device_type_options: { none: 'None', desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' },
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
      status_options: { open: 'Open', resolved: 'Resolved', wont_fix: "Won't Fix" },
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

// Mock heavy criteria constants so render stays fast in this validation-focused test.
vi.mock('@/lib/constants', () => ({
  WCAG_CRITERION_CODES: ['1.1.1', '1.4.3'],
  WCAG_CRITERION_NAMES: { '1.1.1': 'Non-text Content', '1.4.3': 'Contrast (Minimum)' },
  SECTION_508_CRITERION_CODES: ['302.1'],
  SECTION_508_CRITERION_NAMES: { '302.1': 'Without Vision' },
  EN301549_CRITERION_CODES: ['4.2.1'],
  EN301549_CRITERION_NAMES: { '4.2.1': 'Usage without vision' },
}));

const mockIssue: Issue = {
  id: 'i1',
  assessment_id: 'a1',
  title: 'Missing alt text',
  description: 'Image has no alt attribute',
  severity: 'high',
  status: 'open',
  wcag_codes: ['1.1.1'],
  section_508_codes: [],
  eu_codes: [],
  ai_suggested_codes: [],
  ai_confidence_score: null,
  device_type: null,
  browser: null,
  operating_system: null,
  assistive_technology: null,
  user_impact: null,
  selector: null,
  code_snippet: null,
  suggested_fix: null,
  url: null,
  evidence_media: [],
  tags: [],
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

test('shows validation error when title is empty on submit', async () => {
  renderWithIntl(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
}, 15000);

test('does not call onSubmit when title is empty', async () => {
  const onSubmit = vi.fn();
  renderWithIntl(<IssueForm onSubmit={onSubmit} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() => screen.getByRole('alert'));
  expect(onSubmit).not.toHaveBeenCalled();
}, 15000);

test('calls onSubmit with title when form is valid', async () => {
  const onSubmit = vi.fn();
  renderWithIntl(<IssueForm onSubmit={onSubmit} projectId="p1" />);
  await userEvent.type(screen.getByLabelText(/^title/i), 'Button not focusable');
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Button not focusable' }),
      expect.anything()
    )
  );
}, 15000);

test('pre-populates title and description from issue prop', () => {
  renderWithIntl(<IssueForm issue={mockIssue} onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByLabelText(/^title/i)).toHaveValue('Missing alt text');
  expect(screen.getByLabelText(/^description$/i)).toHaveValue('Image has no alt attribute');
}, 15000);
