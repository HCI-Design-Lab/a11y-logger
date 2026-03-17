'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PanelIssue {
  id: string;
  project_id: string;
  assessment_id: string;
  title: string;
  severity: string;
  description: string;
  url: string;
}

interface VpatIssuesPanelProps {
  issues: PanelIssue[];
  criterionCode: string;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export function VpatIssuesPanel({ issues, criterionCode, onClose }: VpatIssuesPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-xl z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Issues for criterion ${criterionCode}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold">Issues for {criterionCode}</h2>
          <p className="text-sm text-muted-foreground">
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          ref={closeButtonRef}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No issues mapped to this criterion.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-tight">{issue.title}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${SEVERITY_COLORS[issue.severity] ?? ''}`}
                >
                  {issue.severity}
                </Badge>
              </div>
              {issue.description && (
                <p className="text-xs text-muted-foreground">{issue.description}</p>
              )}
              {issue.url && (
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block truncate"
                >
                  {issue.url}
                </a>
              )}
              <a
                href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
                className="text-xs font-medium text-primary hover:underline"
                aria-label={`Open issue: ${issue.title}`}
              >
                Open issue →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
