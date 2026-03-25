'use client';
import { cn } from '@/lib/utils';
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
    <div role="group" aria-label="Filter by status" className="flex gap-1">
      {STATUS_OPTIONS.map(({ value, label }) => (
        <Button
          type="button"
          key={value}
          size="xs"
          onClick={() => toggle(value)}
          aria-pressed={statuses.includes(value)}
          className={cn(
            'rounded px-3',
            statuses.includes(value)
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
