import { render, screen } from '@testing-library/react';
import { ProjectForm } from '@/components/projects/project-form';

const noop = () => {};

test('renders save button', () => {
  render(<ProjectForm onSubmit={noop} />);
  expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
});

test('renders cancel link when cancelHref is provided', () => {
  render(<ProjectForm onSubmit={noop} cancelHref="/projects" />);
  const cancelLink = screen.getByRole('link', { name: /cancel/i });
  expect(cancelLink).toBeInTheDocument();
  expect(cancelLink).toHaveAttribute('href', '/projects');
});

test('does not render cancel link when cancelHref is omitted', () => {
  render(<ProjectForm onSubmit={noop} />);
  expect(screen.queryByRole('link', { name: /cancel/i })).not.toBeInTheDocument();
});
