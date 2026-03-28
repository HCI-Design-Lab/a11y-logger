import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));
vi.mock('@/components/issues/import-issues-modal', () => ({
  ImportIssuesModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" data-testid="import-modal" /> : null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
global.fetch = vi.fn();

beforeEach(() => vi.clearAllMocks());

import { AssessmentSettingsMenu } from '../assessment-settings-menu';

const baseProps = { projectId: 'p1', assessmentId: 'a1' };

test('renders a settings trigger button', () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  expect(screen.getByRole('button', { name: /assessment settings/i })).toBeInTheDocument();
});

test('dropdown contains Add Issue link pointing to issues/new', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  const item = await screen.findByRole('menuitem', { name: /add issue/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/new');
});

test('dropdown contains Edit Assessment link pointing to edit page', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  const item = await screen.findByRole('menuitem', { name: /edit assessment/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/edit');
});

test('dropdown contains Import Issues item', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /import issues/i })).toBeInTheDocument();
});

test('clicking Import Issues opens the import modal', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /import issues/i }));
  expect(screen.getByTestId('import-modal')).toBeInTheDocument();
});

test('renders Mark as In Progress item when status is ready', async () => {
  render(<AssessmentSettingsMenu {...baseProps} currentStatus="ready" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as in progress/i })).toBeInTheDocument();
});

test('renders Mark as Complete item when status is in_progress', async () => {
  render(<AssessmentSettingsMenu {...baseProps} currentStatus="in_progress" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as complete/i })).toBeInTheDocument();
});

test('renders Mark as Incomplete item when status is completed', async () => {
  render(<AssessmentSettingsMenu {...baseProps} currentStatus="completed" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as incomplete/i })).toBeInTheDocument();
});

test('clicking Mark as Complete calls the assessments API', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  render(<AssessmentSettingsMenu {...baseProps} currentStatus="in_progress" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /mark as complete/i }));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

test('dropdown contains Delete Assessment option', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /delete assessment/i })).toBeInTheDocument();
});

test('clicking Delete Assessment opens confirmation dialog', async () => {
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});

test('confirming delete calls DELETE /api/projects/p1/assessments/a1 and redirects', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  await userEvent.click(screen.getByRole('button', { name: /delete assessment/i }));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(mockPush).toHaveBeenCalledWith('/projects/p1');
    expect(mockRefresh).toHaveBeenCalled();
  });
});

test('shows error toast and does not redirect when API returns failure', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false, error: 'Not found' }),
  });
  render(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  await userEvent.click(screen.getByRole('button', { name: /delete assessment/i }));
  await waitFor(() => {
    expect(mockPush).not.toHaveBeenCalled();
  });
});
