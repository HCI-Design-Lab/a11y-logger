import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Mock fetch
global.fetch = vi.fn();

import { DeleteAssessmentButton } from '@/components/assessments/delete-assessment-button';
import { toast } from 'sonner';

const messages = {
  assessments: {
    delete_dialog: {
      title: 'Delete {name}?',
      description:
        'This will permanently delete this assessment and all its issues. This cannot be undone.',
      confirm_button: 'Delete Assessment',
      cancel_button: 'Cancel',
    },
    toast: {
      deleted: 'Assessment deleted',
      delete_failed: 'Failed to delete assessment',
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

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders the Delete trigger button', () => {
  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('shows the assessment name in the confirmation dialog', async () => {
  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByText('Delete Mobile Audit Q1?')).toBeInTheDocument();
});

test('calls the correct DELETE API endpoint on confirm', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });

  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete assessment/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

test('redirects to project page on success', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });

  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete assessment/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/projects/p1');
  });
});

test('Cancel button in confirm dialog has an icon', async () => {
  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
  expect(cancelBtn.querySelector('svg')).toBeInTheDocument();
});

test('shows an error toast on API failure', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false }),
  });

  renderWithIntl(
    <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete assessment/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('i18n integration — real NextIntlClientProvider', () => {
  it('renders Delete Assessment confirm button from catalog', async () => {
    renderWithIntl(
      <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(await screen.findByRole('button', { name: 'Delete Assessment' })).toBeInTheDocument();
  });

  it('renders Cancel button from catalog', async () => {
    renderWithIntl(
      <DeleteAssessmentButton projectId="p1" assessmentId="a1" assessmentName="Mobile Audit Q1" />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
