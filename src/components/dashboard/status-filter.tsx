'use client';
import { Square, SquareCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

const STATUS_OPTION_KEYS = ['open', 'resolved', 'wont_fix'] as const;
type StatusKey = (typeof STATUS_OPTION_KEYS)[number];
const STATUS_VALUES: Record<StatusKey, string> = {
  open: 'open',
  resolved: 'resolved',
  wont_fix: 'wont_fix',
};

interface StatusFilterProps {
  statuses: string[];
  onChange: (statuses: string[]) => void;
}

export function StatusFilter({ statuses, onChange }: StatusFilterProps) {
  const t = useTranslations('dashboard.status_filter');

  function toggle(value: string) {
    const next = statuses.includes(value)
      ? statuses.filter((s) => s !== value)
      : [...statuses, value];
    if (next.length === 0) return; // always keep at least one selected
    onChange(next);
  }

  return (
    <div role="group" aria-label={t('group_aria_label')} className="flex gap-1 p-1">
      {STATUS_OPTION_KEYS.map((key) => {
        const value = STATUS_VALUES[key];
        const label = t(key);
        return (
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
        );
      })}
    </div>
  );
}
