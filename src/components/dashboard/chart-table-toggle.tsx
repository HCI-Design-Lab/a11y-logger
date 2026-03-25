'use client';
import { ChartPie, Table, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChartTableToggleProps {
  view: 'chart' | 'table';
  onChange: (view: 'chart' | 'table') => void;
}

const TOGGLE_OPTIONS: { value: 'chart' | 'table'; label: string; Icon: LucideIcon }[] = [
  { value: 'chart', label: 'Chart view', Icon: ChartPie },
  { value: 'table', label: 'Table view', Icon: Table },
];

export function ChartTableToggle({ view, onChange }: ChartTableToggleProps) {
  return (
    <div role="group" aria-label="View toggle" className="flex gap-1">
      {TOGGLE_OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={view === value}
          aria-label={label}
          className={cn(
            'rounded p-1 transition-colors',
            view === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}
