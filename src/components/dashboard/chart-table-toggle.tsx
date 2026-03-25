'use client';
import { ChartPie, Table, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          variant={view === value ? 'default' : 'secondary'}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}
