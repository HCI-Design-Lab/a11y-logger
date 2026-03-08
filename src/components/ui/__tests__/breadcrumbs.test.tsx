import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '../breadcrumbs';

test('renders all breadcrumb labels', () => {
  render(
    <Breadcrumbs
      items={[
        { label: 'Projects', href: '/projects' },
        { label: 'My Project', href: '/projects/1' },
        { label: 'Edit' },
      ]}
    />
  );
  expect(screen.getByText('Projects')).toBeInTheDocument();
  expect(screen.getByText('My Project')).toBeInTheDocument();
  expect(screen.getByText('Edit')).toBeInTheDocument();
});

test('items with href render as links', () => {
  render(<Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Edit' }]} />);
  expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
});

test('item without href renders as plain text, not a link', () => {
  render(<Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Edit' }]} />);
  expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  expect(screen.getByText('Edit')).toBeInTheDocument();
});

test('has accessible navigation landmark labelled Breadcrumb', () => {
  render(<Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Edit' }]} />);
  expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
});

test('last item has aria-current="page"', () => {
  render(<Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Edit' }]} />);
  expect(screen.getByText('Edit')).toHaveAttribute('aria-current', 'page');
});
