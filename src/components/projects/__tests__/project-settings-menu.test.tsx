import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
global.fetch = vi.fn();

import { ProjectSettingsMenu } from '../project-settings-menu';

const props = { projectId: 'proj-1', projectName: 'Test Project' };

beforeEach(() => vi.clearAllMocks());

describe('ProjectSettingsMenu', () => {
  it('renders a settings trigger button', () => {
    render(<ProjectSettingsMenu {...props} />);
    expect(screen.getByRole('button', { name: /project settings/i })).toBeInTheDocument();
  });

  it('dropdown contains Add Assessment link', async () => {
    render(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    const item = screen.getByRole('menuitem', { name: /add assessment/i });
    expect(item).toHaveAttribute('href', '/projects/proj-1/assessments/new');
  });

  it('dropdown contains Edit Project link', async () => {
    render(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    const item = screen.getByRole('menuitem', { name: /edit project/i });
    expect(item).toHaveAttribute('href', '/projects/proj-1/edit');
  });

  it('dropdown contains Delete Project option', async () => {
    render(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    expect(screen.getByRole('menuitem', { name: /delete project/i })).toBeInTheDocument();
  });

  it('clicking Delete Project opens confirmation dialog', async () => {
    render(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete project/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirming delete calls DELETE /api/projects/proj-1 and redirects', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    render(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete project/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete project/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockPush).toHaveBeenCalledWith('/projects');
    });
  });
});
