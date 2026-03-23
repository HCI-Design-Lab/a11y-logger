import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportOpenAcrModal } from '../import-openacr-modal';

vi.mock('js-yaml', () => ({
  default: {
    load: vi.fn(() => ({
      title: 'Parsed VPAT',
      catalog: '2.4-edition-wcag-2.1-en',
      notes: '',
      chapters: {
        success_criteria_level_a: {
          criteria: [
            { num: '1.1.1', components: [{ adherence: { level: 'supports', notes: '' } }] },
            { num: '1.3.1', components: [{ adherence: { level: 'supports', notes: '' } }] },
          ],
        },
      },
    })),
  },
}));

const defaultProps = { onImportComplete: vi.fn() };

describe('ImportOpenAcrModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [{ id: 'p1', name: 'My Project' }] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'vpat-123', skipped: [] } }),
      });
  });

  it('renders a trigger button', () => {
    render(<ImportOpenAcrModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /import from openacr/i })).toBeInTheDocument();
  });

  it('opens the modal and shows step 1 (select project)', async () => {
    render(<ImportOpenAcrModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import from openacr/i }));
    expect(screen.getByText(/select project/i)).toBeInTheDocument();
  });

  it('advances to step 2 after selecting a project', async () => {
    render(<ImportOpenAcrModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import from openacr/i }));
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByRole('combobox'), 'p1');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/upload openacr yaml/i)).toBeInTheDocument();
  });

  it('shows a preview after uploading a valid YAML file', async () => {
    render(<ImportOpenAcrModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import from openacr/i }));
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByRole('combobox'), 'p1');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    const file = new File(['catalog: 2.4-edition-wcag-2.1-en\nchapters: {}'], 'vpat.yaml', {
      type: 'application/yaml',
    });
    await userEvent.upload(screen.getByLabelText(/yaml file/i), file);

    await waitFor(() => expect(screen.getByText('Parsed VPAT')).toBeInTheDocument());
    expect(screen.getByText(/2 criteria/i)).toBeInTheDocument();
  });

  it('calls onImportComplete after successful import', async () => {
    render(<ImportOpenAcrModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import from openacr/i }));
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByRole('combobox'), 'p1');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    const file = new File(['catalog: x\nchapters: {}'], 'vpat.yaml', { type: 'application/yaml' });
    await userEvent.upload(screen.getByLabelText(/yaml file/i), file);
    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /^import$/i }));

    await waitFor(() => expect(defaultProps.onImportComplete).toHaveBeenCalledWith('vpat-123'));
  });
});
