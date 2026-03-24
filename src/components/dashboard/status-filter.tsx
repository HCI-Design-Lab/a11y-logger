'use client';
import { cn } from '@/lib/utils';

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
    <div role="group" aria-label="Filter by status" className="flex gap-1">
      {STATUS_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => toggle(value)}
          aria-pressed={statuses.includes(value)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition-colors',
            statuses.includes(value)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
