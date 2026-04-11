'use client';

import { Table, LayoutGrid } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="View options"
      className="relative inline-flex items-center rounded-full border bg-muted p-0.5"
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        className={`absolute h-7 w-7 rounded-full bg-primary shadow transition-transform duration-200 ${
          view === 'grid' ? 'translate-x-7' : 'translate-x-0'
        }`}
      />

      <button
        type="button"
        onClick={() => onViewChange('table')}
        aria-label="Table view"
        aria-pressed={view === 'table'}
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${view !== 'table' ? 'hover:bg-accent dark:hover:bg-muted hover:border hover:border-border dark:hover:border-muted-foreground/40' : ''}`}
      >
        <Table
          className={`h-3.5 w-3.5 ${view === 'table' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${view !== 'grid' ? 'hover:bg-accent dark:hover:bg-muted hover:border hover:border-border dark:hover:border-muted-foreground/40' : ''}`}
      >
        <LayoutGrid
          className={`h-3.5 w-3.5 ${view === 'grid' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
