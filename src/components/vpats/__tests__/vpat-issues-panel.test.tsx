import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { VpatIssuesPanel } from '@/components/vpats/vpat-issues-panel';

const messages = {
  issues: {
    badge: {
      severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
      status: { open: 'Open', resolved: 'Resolved', wont_fix: "Won't Fix" },
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

const issues = [
  {
    id: '1',
    project_id: 'proj-1',
    assessment_id: 'assess-1',
    title: 'Missing alt text',
    severity: 'high' as const,
    description: 'Image lacks alt attribute.',
    url: 'https://example.com/page',
  },
];

describe('VpatIssuesPanel', () => {
  it('renders issue title', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('renders severity badge with SeverityBadge styling', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders criterion code in header', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText(/1.1.1/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when no issues', () => {
    renderWithIntl(<VpatIssuesPanel issues={[]} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it('does not render the issue URL', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /example.com/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/example\.com/)).not.toBeInTheDocument();
  });

  it('description is hidden by default', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(screen.queryByText('Image lacks alt attribute.')).not.toBeInTheDocument();
  });

  it('clicking issue expands to show description', async () => {
    const user = userEvent.setup();
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    await user.click(screen.getByText('Missing alt text'));
    expect(screen.getByText('Image lacks alt attribute.')).toBeInTheDocument();
  });

  it('clicking expanded issue collapses to hide description', async () => {
    const user = userEvent.setup();
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    await user.click(screen.getByText('Missing alt text'));
    expect(screen.getByText('Image lacks alt attribute.')).toBeInTheDocument();
    await user.click(screen.getByText('Missing alt text'));
    expect(screen.queryByText('Image lacks alt attribute.')).not.toBeInTheDocument();
  });

  it('closes panel when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Open issue link pointing to the issue page', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    const link = screen.getByRole('link', { name: /open issue: missing alt text/i });
    expect(link).toHaveAttribute('href', '/projects/proj-1/assessments/assess-1/issues/1');
  });

  it('Open issue link opens in a new tab', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    const link = screen.getByRole('link', { name: /open issue: missing alt text/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('locks body scroll when mounted', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when unmounted', () => {
    const { unmount } = renderWithIntl(
      <VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />
    );
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus to the close button when the panel mounts', () => {
    renderWithIntl(<VpatIssuesPanel issues={issues} criterionCode="1.1.1" onClose={vi.fn()} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(document.activeElement).toBe(closeButton);
  });
});
