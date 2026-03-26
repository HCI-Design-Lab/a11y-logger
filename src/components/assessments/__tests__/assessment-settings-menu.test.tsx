import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/components/issues/import-issues-modal', () => ({
  ImportIssuesModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" data-testid="import-modal" /> : null,
}));

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
