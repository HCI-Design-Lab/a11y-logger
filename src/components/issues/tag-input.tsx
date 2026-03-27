'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({ tags, onChange, placeholder = 'Add tag…', disabled }: TagInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      onChange([...tags, trimmed]);
      setValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="ml-0.5 h-4 w-4 rounded-full p-0 hover:bg-muted-foreground/20"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
