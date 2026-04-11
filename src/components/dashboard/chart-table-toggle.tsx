'use client';
import { ChartPie, Table } from 'lucide-react';

interface ChartTableToggleProps {
  view: 'chart' | 'table';
  onChange: (view: 'chart' | 'table') => void;
}

export function ChartTableToggle({ view, onChange }: ChartTableToggleProps) {
  return (
    <div
      role="group"
      aria-label="View toggle"
      className="relative inline-flex items-center rounded-full border bg-card p-0.5"
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        className={`absolute h-7 w-7 rounded-full bg-primary shadow transition-transform duration-200 ${
          view === 'table' ? 'translate-x-7' : 'translate-x-0'
        }`}
      />

      <button
        type="button"
        onClick={() => onChange('chart')}
        aria-pressed={view === 'chart'}
        aria-label="Chart view"
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${view !== 'chart' ? 'hover:bg-accent dark:hover:bg-muted hover:border hover:border-border dark:hover:border-muted-foreground/40' : ''}`}
      >
        <ChartPie
          className={`h-3.5 w-3.5 ${view === 'chart' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        aria-label="Table view"
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${view !== 'table' ? 'hover:bg-accent dark:hover:bg-muted hover:border hover:border-border dark:hover:border-muted-foreground/40' : ''}`}
      >
        <Table
          className={`h-3.5 w-3.5 ${view === 'table' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
