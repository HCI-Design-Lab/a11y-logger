'use client';
import { X } from 'lucide-react';
import {
  SECTION_508_CRITERION_CODES,
  SECTION_508_CRITERION_NAMES,
} from '@/lib/constants/section508';
import { Button } from '@/components/ui/button';

interface Section508SelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}

export function Section508Selector({ selected, onChange, disabled }: Section508SelectorProps) {
  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {code}
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(code)}
                disabled={disabled}
                className="ml-0.5 h-4 w-4 rounded-full p-0 hover:bg-primary/20"
                aria-label={`Remove Section 508 ${code}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto rounded-md border p-2 space-y-1">
        {SECTION_508_CRITERION_CODES.map((code) => {
          const id = `section508-${code}`;
          return (
            <label
              key={code}
              htmlFor={id}
              className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-muted text-sm"
            >
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(code)}
                onChange={() => toggle(code)}
                disabled={disabled}
                aria-label={code}
              />
              <span className="font-mono">{code}</span>
              {SECTION_508_CRITERION_NAMES[code] && (
                <span className="text-muted-foreground">{SECTION_508_CRITERION_NAMES[code]}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
