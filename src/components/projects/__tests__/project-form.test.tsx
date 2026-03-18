import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProjectForm } from '../project-form';
import type { Project } from '@/lib/db/projects';

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
  render(<ProjectForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/product url/i)).toBeInTheDocument();
});

test('shows validation error when name is empty', async () => {
  render(<ProjectForm onSubmit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
});

test('calls onSubmit with form values when valid', async () => {
  const onSubmit = vi.fn();
  render(<ProjectForm onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText(/project name/i), 'My App');
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My App' }))
  );
});

test('pre-populates fields when project prop is provided', () => {
  render(<ProjectForm project={mockProject} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toHaveValue('Existing Project');
  expect(screen.getByLabelText(/description/i)).toHaveValue('A description');
  expect(screen.getByLabelText(/product url/i)).toHaveValue('https://example.com');
});

test('does not call onSubmit when name is empty', async () => {
  const onSubmit = vi.fn();
  render(<ProjectForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  await waitFor(() => screen.getByRole('alert'));
  expect(onSubmit).not.toHaveBeenCalled();
});
