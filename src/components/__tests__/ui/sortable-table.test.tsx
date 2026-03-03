import { render, screen, fireEvent } from '@testing-library/react';
import { SortableTable } from '@/components/ui/sortable-table';

interface Row {
  id: string;
  name: string;
  count: number;
}

const columns = [
  { key: 'name' as const, label: 'Name', render: (row: Row) => row.name },
  { key: 'count' as const, label: 'Count', render: (row: Row) => row.count },
];

const rows: Row[] = [
  { id: '1', name: 'Zebra', count: 5 },
  { id: '2', name: 'Alpha', count: 2 },
];

test('renders all rows', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  expect(screen.getByText('Zebra')).toBeInTheDocument();
  expect(screen.getByText('Alpha')).toBeInTheDocument();
});

test('renders column headers', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /count/i })).toBeInTheDocument();
});

test('default sort is applied on initial render', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha');
  expect(tableRows[1]).toHaveTextContent('Zebra');
});

test('clicking the active sort header toggles to descending', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Zebra');
  expect(tableRows[1]).toHaveTextContent('Alpha');
});

test('clicking the active sort header twice returns to ascending', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha');
  expect(tableRows[1]).toHaveTextContent('Zebra');
});

test('clicking a different column sorts ascending by that column', () => {
  render(
    <SortableTable columns={columns} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />
  );
  fireEvent.click(screen.getByRole('button', { name: /count/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha'); // count 2
  expect(tableRows[1]).toHaveTextContent('Zebra'); // count 5
});

test('shows empty message when rows is empty', () => {
  render(
    <SortableTable
      columns={columns}
      rows={[]}
      defaultSortKey="name"
      getKey={(r) => r.id}
      emptyMessage="Nothing here."
    />
  );
  expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
