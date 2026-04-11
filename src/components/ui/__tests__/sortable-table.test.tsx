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

// 12 rows to test pagination with default page size of 10
const manyRows: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${String(i + 1).padStart(2, '0')}`,
  count: i + 1,
}));

test('renders all rows', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  expect(screen.getByText('Zebra')).toBeInTheDocument();
  expect(screen.getByText('Alpha')).toBeInTheDocument();
});

test('renders column headers', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /count/i })).toBeInTheDocument();
});

test('default sort is applied on initial render', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha');
  expect(tableRows[1]).toHaveTextContent('Zebra');
});

test('clicking the active sort header toggles to descending', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Zebra');
  expect(tableRows[1]).toHaveTextContent('Alpha');
});

test('clicking the active sort header twice returns to ascending', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha');
  expect(tableRows[1]).toHaveTextContent('Zebra');
});

test('clicking a different column sorts ascending by that column', () => {
  render(
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /count/i }));
  const tableRows = screen.getAllByRole('row').slice(1);
  expect(tableRows[0]).toHaveTextContent('Alpha'); // count 2
  expect(tableRows[1]).toHaveTextContent('Zebra'); // count 5
});

// Pagination tests

test('shows only first 10 rows by default when there are more than 10', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  const dataRows = screen.getAllByRole('row').slice(1);
  expect(dataRows).toHaveLength(10);
});

test('shows page indicator text', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
});

test('prev button is disabled on first page', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
});

test('next button navigates to next page', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /next page/i }));
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  const dataRows = screen.getAllByRole('row').slice(1);
  expect(dataRows).toHaveLength(2); // remaining 2 rows
});

test('next button is disabled on last page', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /next page/i }));
  expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
});

test('prev button navigates back', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /next page/i }));
  fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
});

test('changing page size resets to page 1', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /next page/i }));
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

  // Change page size to 25 — all 12 rows fit on one page (Radix Select: click trigger then option)
  fireEvent.click(screen.getByRole('combobox', { name: /rows per page/i }));
  fireEvent.click(screen.getByRole('option', { name: '25' }));
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
});

test('page size 25 shows all rows when total is under 25', () => {
  render(
    <SortableTable
      columns={columns}
      rows={manyRows}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
      defaultPageSize={25}
    />
  );
  const dataRows = screen.getAllByRole('row').slice(1);
  expect(dataRows).toHaveLength(12);
});

test('column className is applied to the <th> element', () => {
  const cols = [
    { key: 'name' as const, label: 'Name', className: 'w-1/2', render: (row: Row) => row.name },
    { key: 'count' as const, label: 'Count', render: (row: Row) => row.count },
  ];
  render(<SortableTable columns={cols} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />);
  const nameHeader = screen.getByRole('columnheader', { name: /name/i });
  expect(nameHeader).toHaveClass('w-1/2');
});

test('column cellClassName is applied to every <td> in that column', () => {
  const cols = [
    {
      key: 'name' as const,
      label: 'Name',
      cellClassName: 'max-w-0',
      render: (row: Row) => row.name,
    },
    { key: 'count' as const, label: 'Count', render: (row: Row) => row.count },
  ];
  render(<SortableTable columns={cols} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />);
  // Both data rows should have a cell with max-w-0
  const cells = document.querySelectorAll('td.max-w-0');
  expect(cells).toHaveLength(2);
});

test('table gets table-fixed class when any column has a className', () => {
  const cols = [
    { key: 'name' as const, label: 'Name', className: 'w-1/2', render: (row: Row) => row.name },
    { key: 'count' as const, label: 'Count', render: (row: Row) => row.count },
  ];
  render(<SortableTable columns={cols} rows={rows} defaultSortKey="name" getKey={(r) => r.id} />);
  expect(screen.getByRole('table')).toHaveClass('table-fixed');
});

test('shows empty message when rows is empty', () => {
  render(
    <SortableTable
      columns={columns}
      rows={[]}
      defaultSortKey="name"
      getKey={(r) => r.id as string}
      emptyMessage="Nothing here."
    />
  );
  expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
