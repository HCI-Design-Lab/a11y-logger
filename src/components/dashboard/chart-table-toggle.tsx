'use client';
import { BarChart2, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartTableToggleProps {
  view: 'chart' | 'table';
  onChange: (view: 'chart' | 'table') => void;
}

export function ChartTableToggle({ view, onChange }: ChartTableToggleProps) {
  return (
    <div role="group" aria-label="View toggle" className="flex gap-1">
      <button
        onClick={() => onChange('chart')}
        aria-pressed={view === 'chart'}
        aria-label="Chart view"
        className={cn(
          'rounded p-1 transition-colors',
          view === 'chart'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <BarChart2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        aria-label="Table view"
        className={cn(
          'rounded p-1 transition-colors',
          view === 'table'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Table2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
