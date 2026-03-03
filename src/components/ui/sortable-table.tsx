'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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

export function SortableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = 'asc',
  getKey,
  emptyMessage = 'No results.',
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T & string>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  function handleSort(key: keyof T & string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
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

  return (
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
        {sorted.map((row) => (
          <TableRow key={getKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
