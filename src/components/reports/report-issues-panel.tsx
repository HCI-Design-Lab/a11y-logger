'use client';
import { useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Issue } from '@/lib/db/issues';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

interface Props {
  issues: Issue[];
}

export function ReportIssuesPanel({ issues }: Props) {
  const [selected, setSelected] = useState<Issue | null>(null);

  if (selected) {
    const wcagCodes: string[] = Array.isArray(selected.wcag_codes)
      ? selected.wcag_codes
      : JSON.parse((selected.wcag_codes as unknown as string) || '[]');

    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to list
        </button>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-snug">{selected.title}</h3>
          <Badge variant={SEVERITY_VARIANT[selected.severity] ?? 'outline'}>
            {selected.severity.toUpperCase()}
          </Badge>
          {selected.description && (
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          )}
          {wcagCodes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                WCAG Criteria
              </p>
              <div className="flex flex-wrap gap-1">
                {wcagCodes.map((code) => (
                  <Badge key={code} variant="outline" className="text-xs">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <a
            href={`/issues/${selected.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Open full issue
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues linked to this report.</p>
      ) : (
        issues.map((issue) => (
          <button
            key={issue.id}
            onClick={() => setSelected(issue)}
            className="w-full text-left rounded p-2 hover:bg-muted transition-colors space-y-0.5"
          >
            <p className="text-sm font-medium leading-snug">{issue.title}</p>
            <Badge variant={SEVERITY_VARIANT[issue.severity] ?? 'outline'} className="text-xs">
              {issue.severity}
            </Badge>
          </button>
        ))
      )}
    </div>
  );
}
