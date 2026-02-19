import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ProjectForm } from '@/components/projects/project-form';

test('renders name field as required', () => {
  render(<ProjectForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toBeRequired();
});

test('submit button is present', () => {
  render(<ProjectForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
});

test('calls onSubmit with form data when submitted', () => {
  const onSubmit = vi.fn();
  render(<ProjectForm onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'My Project' } });
  fireEvent.click(screen.getByRole('button', { name: /save project/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Project' }));
});

test('pre-fills with existing project data', () => {
  const project = {
    id: '1',
    name: 'Existing',
    description: 'Existing desc',
    status: 'active' as const,
    product_url: 'https://example.com',
    settings: '{}',
    created_by: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };
  render(<ProjectForm project={project} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/project name/i)).toHaveValue('Existing');
  expect(screen.getByLabelText(/description/i)).toHaveValue('Existing desc');
});
