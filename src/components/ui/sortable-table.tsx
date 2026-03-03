'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortDir = 'asc' | 'desc';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render: (row: T) => React.ReactNode;
}

interface SortableTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  defaultSortKey: keyof T & string;
  defaultSortDir?: SortDir;
  defaultPageSize?: number;
  getKey: (row: T) => string;
  emptyMessage?: string;
}

function SortHeader<T>({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: keyof T & string;
  current: keyof T & string;
  dir: SortDir;
  onClick: (key: keyof T & string) => void;
}) {
  const active = current === sortKey;
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-semibold"
        onClick={() => onClick(sortKey)}
        aria-label={label}
      >
        {label}
        <Icon className="ml-1 h-4 w-4" aria-hidden="true" />
      </Button>
    </TableHead>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function SortableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = 'asc',
  defaultPageSize = 10,
  getKey,
  emptyMessage = 'No results.',
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T & string>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  function handleSort(key: keyof T & string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>;
  }

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <SortHeader
                key={col.key}
                label={col.label}
                sortKey={col.key}
                current={sortKey}
                dir={sortDir}
                onClick={handleSort}
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <TableRow key={getKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="select-none">
            Rows per page:
          </label>
          <select
            id="page-size"
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-input bg-background px-2 py-1 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="mx-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
