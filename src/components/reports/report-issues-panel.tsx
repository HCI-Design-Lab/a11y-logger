'use client';
import { useState } from 'react';
import { Search, ArrowUpDown, ArrowLeft, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/issues/severity-badge';
import type { IssueWithContext } from '@/lib/db/issues';
import type { Issue } from '@/lib/db/issues';

const SEVERITY_ORDER: Record<Issue['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface Props {
  issues: IssueWithContext[];
}

type SortField = 'title' | 'severity';
type SortDir = 'asc' | 'desc';

export function ReportIssuesPanel({ issues }: Props) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<IssueWithContext | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (selected) {
    const wcagCodes: string[] = Array.isArray(selected.wcag_codes)
      ? selected.wcag_codes
      : JSON.parse((selected.wcag_codes as unknown as string) || '[]');

    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="link"
          onClick={() => setSelected(null)}
          className="h-auto p-0 text-sm flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to list
        </Button>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-snug">{selected.title}</h3>
          <SeverityBadge severity={selected.severity} />
          {selected.description && (
            <p className="text-sm text-muted-foreground my-4">{selected.description}</p>
          )}
          {wcagCodes.length > 0 && (
            <div className="space-y-1 mb-4">
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
            href={`/projects/${selected.project_id}/assessments/${selected.assessment_id}/issues/${selected.id}`}
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

  const filtered = issues
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleSort('title')}
                  className="h-auto p-0 flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-transparent font-medium"
                >
                  Title
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </th>
              <th className="text-right py-2 font-medium">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleSort('severity')}
                  className="h-auto p-0 flex items-center gap-1 ml-auto text-muted-foreground hover:text-foreground hover:bg-transparent font-medium"
                >
                  Severity
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-muted-foreground">
                  {search ? 'No issues match your search.' : 'No issues linked to this report.'}
                </td>
              </tr>
            ) : (
              filtered.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => setSelected(issue)}
                  className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <td className="py-2 pr-3">{issue.title}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <SeverityBadge severity={issue.severity} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
