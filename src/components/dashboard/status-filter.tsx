'use client';
import { Square, SquareCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'wont_fix', label: "Won't Fix" },
] as const;

interface StatusFilterProps {
  statuses: string[];
  onChange: (statuses: string[]) => void;
}

export function StatusFilter({ statuses, onChange }: StatusFilterProps) {
  function toggle(value: string) {
    const next = statuses.includes(value)
      ? statuses.filter((s) => s !== value)
      : [...statuses, value];
    if (next.length === 0) return; // always keep at least one selected
    onChange(next);
  }

  return (
    <div role="group" aria-label="Filter by status" className="flex gap-1 p-1">
      {STATUS_OPTIONS.map(({ value, label }) => (
        <Button
          size={'sm'}
          type="button"
          key={value}
          variant={statuses.includes(value) ? 'default' : 'outline'}
          className={statuses.includes(value) ? '' : 'bg-card hover:underline'}
          onClick={() => toggle(value)}
          aria-pressed={statuses.includes(value)}
        >
          {statuses.includes(value) ? (
            <SquareCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Square className="h-4 w-4" aria-hidden="true" />
          )}
          {label}
        </Button>
      ))}
    </div>
  );
}
