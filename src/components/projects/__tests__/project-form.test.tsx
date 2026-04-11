import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ProjectForm } from '../project-form';
import type { Project } from '@/lib/db/projects';

const messages = {
  projects: {
    form: {
      name_label: 'Project Name',
      name_placeholder: 'e.g. Mobile App Redesign',
      description_label: 'Description',
      description_placeholder: 'Brief description of the project',
      product_url_label: 'Product URL',
      product_url_placeholder: 'https://example.com',
      save_button: 'Save Project',
      save_button_loading: 'Saving…',
      cancel_button: 'Cancel',
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

const mockProject: Project = {
  id: 'p1',
  name: 'Existing Project',
  description: 'A description',
  product_url: 'https://example.com',
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

test('renders name, description, and product_url fields', () => {
  renderWithIntl(<ProjectForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/product url/i)).toBeInTheDocument();
});

test('shows validation error when name is empty', async () => {
  renderWithIntl(<ProjectForm onSubmit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
});

test('calls onSubmit with form values when valid', async () => {
  const onSubmit = vi.fn();
  renderWithIntl(<ProjectForm onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText(/project name/i), 'My App');
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My App' }),
      expect.anything()
    )
  );
});

test('pre-populates fields when project prop is provided', () => {
  renderWithIntl(<ProjectForm project={mockProject} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toHaveValue('Existing Project');
  expect(screen.getByLabelText(/description/i)).toHaveValue('A description');
  expect(screen.getByLabelText(/product url/i)).toHaveValue('https://example.com');
});

test('does not call onSubmit when name is empty', async () => {
  const onSubmit = vi.fn();
  renderWithIntl(<ProjectForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() => screen.getByRole('alert'));
  expect(onSubmit).not.toHaveBeenCalled();
});

describe('i18n integration — real NextIntlClientProvider', () => {
  it('renders translated name label from catalog', () => {
    renderWithIntl(<ProjectForm onSubmit={vi.fn()} />);
    // Label text is "Project Name *" — match with regex
    expect(screen.getByText(/^Project Name/)).toBeInTheDocument();
  });

  it('renders translated name placeholder from catalog', () => {
    renderWithIntl(<ProjectForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. Mobile App Redesign')).toBeInTheDocument();
  });

  it('renders translated save button from catalog', () => {
    renderWithIntl(<ProjectForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
  });
});
