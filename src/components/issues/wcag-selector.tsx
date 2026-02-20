'use client';
import { X } from 'lucide-react';

const WCAG_CODES = [
  { code: '1.1.1', name: 'Non-text Content', level: 'A' },
  { code: '1.3.1', name: 'Info and Relationships', level: 'A' },
  { code: '1.4.3', name: 'Contrast (Minimum)', level: 'AA' },
  { code: '1.4.11', name: 'Non-text Contrast', level: 'AA' },
  { code: '2.1.1', name: 'Keyboard', level: 'A' },
  { code: '2.1.2', name: 'No Keyboard Trap', level: 'A' },
  { code: '2.4.3', name: 'Focus Order', level: 'A' },
  { code: '2.4.7', name: 'Focus Visible', level: 'AA' },
  { code: '3.3.1', name: 'Error Identification', level: 'A' },
  { code: '3.3.3', name: 'Error Suggestion', level: 'AA' },
  { code: '4.1.2', name: 'Name, Role, Value', level: 'A' },
];

interface WcagSelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export function WcagSelector({ selected, onChange }: WcagSelectorProps) {
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
              <button
                type="button"
                onClick={() => toggle(code)}
                className="ml-0.5 rounded-full hover:bg-primary/20"
                aria-label={`Remove WCAG ${code}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
        {WCAG_CODES.map(({ code, name, level }) => {
          const id = `wcag-${code}`;
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
                aria-label={`${code} ${name}`}
              />
              <span className="font-mono">{code}</span>
              <span className="text-muted-foreground">{name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{level}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
