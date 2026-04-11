import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock next/navigation
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Mock fetch
global.fetch = vi.fn();

import { DeleteProjectButton } from '@/components/projects/delete-project-button';

const messages = {
  projects: {
    delete_dialog: {
      title: 'Delete Project?',
      description:
        'This will permanently delete this project and all its assessments and issues. This cannot be undone.',
      confirm_button: 'Delete Project',
      cancel_button: 'Cancel',
    },
    toast: {
      deleted: 'Project deleted',
      delete_failed: 'Failed to delete project',
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

test('renders delete button', () => {
  renderWithIntl(<DeleteProjectButton projectId="1" projectName="Test Project" />);
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('shows confirmation dialog when delete button clicked', async () => {
  renderWithIntl(<DeleteProjectButton projectId="1" projectName="My Project" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
});
