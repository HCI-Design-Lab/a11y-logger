'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/issues/severity-badge';
import type { Issue } from '@/lib/db/issues';

export interface PanelIssue {
  id: string;
  project_id: string;
  assessment_id: string;
  title: string;
  severity: Issue['severity'];
  description: string;
  url: string;
}

interface VpatIssuesPanelProps {
  issues: PanelIssue[];
  criterionCode: string;
  onClose: () => void;
}

function IssueRow({ issue }: { issue: PanelIssue }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="w-full text-left p-3 flex items-start gap-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="text-sm font-medium leading-tight block">{issue.title}</span>
        </span>
        <span className="shrink-0">
          <SeverityBadge severity={issue.severity} />
        </span>
      </button>

      <div className="px-3 pb-3 flex items-center justify-between">
        <a
          href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary hover:underline"
          aria-label={`Open issue: ${issue.title}`}
        >
          Open issue →
        </a>
      </div>

      {expanded && issue.description && (
        <div className="px-3 pb-3 border-t pt-2">
          <p className="text-xs text-muted-foreground">{issue.description}</p>
        </div>
      )}
    </div>
  );
}

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
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No issues mapped to this criterion.</p>
          </div>
        ) : (
          issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}
