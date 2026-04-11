import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((file, opts) => {
      opts.complete({
        data: [{ title: 'Issue 1' }],
        meta: { fields: ['title'] },
      });
    }),
  },
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: { imported: 1, warnings: [] } }),
});

import { ImportIssuesModal } from '../import-issues-modal';

const messages = {
  issues: {
    import: {
      button_label: 'Import Issues',
      modal_title: 'Import Issues',
      csv_tab: 'CSV',
      openacr_tab: 'OpenACR',
      upload_button: 'Upload File',
      import_button: 'Import',
      cancel_button: 'Cancel',
      map_columns_title: 'Map Columns',
      csv_file_label: 'CSV File',
      preview_label: 'Preview ({count} rows)',
      field_column_header: 'Issue Field',
      csv_column_header: 'CSV Column',
      skip_option: '— skip —',
      next_button: 'Next',
      importing_label: 'Importing…',
      import_rows_button: 'Import {count} rows',
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

const defaultProps = {
  projectId: 'proj-1',
  assessmentId: 'assess-1',
  onImportComplete: vi.fn(),
};

test('renders trigger button with translated label', () => {
  renderWithIntl(<ImportIssuesModal {...defaultProps} />);
  expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
});

test('cancel button renders with translated label', async () => {
  renderWithIntl(<ImportIssuesModal {...defaultProps} />);
  await (
    await import('@testing-library/user-event')
  ).default.click(screen.getByRole('button', { name: /import/i }));
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});
