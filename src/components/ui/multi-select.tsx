'use client';

import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-controls="multi-select-listbox"
          aria-haspopup="listbox"
          aria-label="Open options"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setOpen(true);
          }}
          className={cn(
            'flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <Badge key={o.value} variant="secondary" className="gap-1 pr-1">
                {o.label}
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Remove ${o.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                  className="ml-0.5 h-4 w-4 rounded-sm p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover shadow-md"
          align="start"
          sideOffset={4}
        >
          <div className="border-b px-3 py-2">
            <input
              type="text"
              role="textbox"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul id="multi-select-listbox" role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={selected.includes(o.value)}
                onClick={() => toggle(o.value)}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    selected.includes(o.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {o.label}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">No results.</li>
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
