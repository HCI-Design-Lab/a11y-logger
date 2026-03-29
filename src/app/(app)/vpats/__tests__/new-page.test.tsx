import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import jsYaml from 'js-yaml';
import NewVpatPage from '../new/page';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('js-yaml', () => ({
  default: { load: vi.fn() },
}));

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(jsYaml.load).mockReset();
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: [{ id: 'proj-1', name: 'Test Project' }] }),
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NewVpatPage', () => {
  it('shows step 1 edition selection on mount', () => {
    render(<NewVpatPage />);
    expect(screen.getByText(/Select Edition/i)).toBeInTheDocument();
    expect(screen.getByText('WCAG')).toBeInTheDocument();
    expect(screen.getByText('Section 508')).toBeInTheDocument();
    expect(screen.getByText(/EN 301 549/)).toBeInTheDocument();
    expect(screen.getByText(/International/i)).toBeInTheDocument();
  });

  it('advances to step 2 after selecting an edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Product Scope/i)).toBeInTheDocument();
  });

  it('shows WCAG version selector on step 2 for WCAG edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/WCAG Version/i)).toBeInTheDocument();
  });

  it('hides WCAG version selector for 508 edition', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('Section 508'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.queryByLabelText(/WCAG Version/i)).not.toBeInTheDocument();
  });

  it('shows step 3 details after scope is configured', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText('WCAG'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });

  it('omits wcag_version from payload for Section 508 edition', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    vi.spyOn(global, 'fetch').mockImplementation(async (url: unknown, opts?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : String(url);
      if (urlStr === '/api/vpats' && opts?.method === 'POST') {
        capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>;
        return {
          ok: true,
          json: async () => ({ success: true, data: { id: 'vpat-1' } }),
        } as unknown as Response;
      }
      // Return projects list for all other GET requests
      return {
        ok: true,
        json: async () => ({ success: true, data: [{ id: 'proj-1', name: 'Test Project' }] }),
      } as unknown as Response;
    });

    render(<NewVpatPage />);

    // Step 1: Select 508
    fireEvent.click(screen.getByText('Section 508'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Next
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: wait for project list to load, fill title, select project, submit
    await waitFor(() => expect(screen.getByLabelText(/Title/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test' } });

    // Wait for the project option to be loaded from the mocked fetch
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Test Project' })).toBeInTheDocument()
    );
    const projectSelect = screen.getByLabelText(/Project/i);
    fireEvent.change(projectSelect, { target: { value: 'proj-1' } });

    fireEvent.submit(screen.getByRole('button', { name: /create vpat/i }).closest('form')!);

    await vi.waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody!.standard_edition).toBe('508');
      expect(capturedBody!).not.toHaveProperty('wcag_version');
      expect(capturedBody!).not.toHaveProperty('wcag_level');
    });

    // Also verify redirect happened
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/vpats/vpat-1');
    });
  });

  it('shows Import from OpenACR tile in step 1', () => {
    render(<NewVpatPage />);
    expect(screen.getByText(/Import from OpenACR/i)).toBeInTheDocument();
  });

  it('advances to YAML upload step when Import tile is selected', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText(/Import from OpenACR/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/yaml file/i)).toBeInTheDocument();
  });

  it('Next on upload step is disabled until a valid file is parsed', () => {
    render(<NewVpatPage />);
    fireEvent.click(screen.getByText(/Import from OpenACR/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('advances to project select step after uploading a valid YAML', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [{ id: 'proj-1', name: 'Test Project' }] }),
    } as unknown as Response);

    vi.mocked(jsYaml.load).mockReturnValue({
      title: 'My VPAT',
      catalog: '2.4-edition-wcag-2.1-en',
      chapters: {
        success_criteria_level_a: {
          criteria: [{ num: '1.1.1', components: [{ adherence: { level: 'supports', notes: '' } }] }],
        },
      },
    });

    render(<NewVpatPage />);
    fireEvent.click(screen.getByText(/Import from OpenACR/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const file = new File(['catalog: x'], 'vpat.yaml', { type: 'application/yaml' });
    const input = screen.getByLabelText(/yaml file/i);
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByLabelText(/project/i)).toBeInTheDocument());
  });

  it('calls /api/vpats/import on confirm and redirects', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: unknown, opts?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : String(url);
      if (urlStr === '/api/vpats/import' && opts?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { id: 'vpat-99', skipped: [] } }),
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: [{ id: 'proj-1', name: 'Test Project' }] }),
      } as unknown as Response;
    });

    vi.mocked(jsYaml.load).mockReturnValue({
      title: 'My VPAT',
      catalog: '2.4-edition-wcag-2.1-en',
      chapters: {
        success_criteria_level_a: {
          criteria: [{ num: '1.1.1', components: [{ adherence: { level: 'supports', notes: '' } }] }],
        },
      },
    });

    render(<NewVpatPage />);

    fireEvent.click(screen.getByText(/Import from OpenACR/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const file = new File(['catalog: x'], 'vpat.yaml', { type: 'application/yaml' });
    await userEvent.upload(screen.getByLabelText(/yaml file/i), file);
    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByRole('option', { name: 'Test Project' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/project/i), { target: { value: 'proj-1' } });
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/vpats/vpat-99'));
  });
});
