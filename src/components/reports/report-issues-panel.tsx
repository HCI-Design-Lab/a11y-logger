'use client';
import { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

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

      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
                >
                  Title
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-right py-2 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('severity')}
                  className="flex items-center gap-1 ml-auto hover:text-foreground text-muted-foreground transition-colors"
                >
                  Severity
                  <ArrowUpDown className="h-3 w-3" />
                </button>
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
                  className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="py-2 pr-3">
                    <a
                      href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline leading-snug"
                    >
                      {issue.title}
                    </a>
                  </td>
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
