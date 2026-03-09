import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CriteriaItem {
  code: string;
  name: string | null;
  count: number;
}

interface ReportWcagCriteriaListProps {
  criteria: CriteriaItem[];
}

export function ReportWcagCriteriaList({ criteria }: ReportWcagCriteriaListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">WCAG by Criterion</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 py-2">No WCAG criteria data.</p>
        ) : (
          <ul className="max-h-300 overflow-y-auto">
            {criteria.map(({ code, name, count }) => (
              <li
                key={code}
                className="flex items-center justify-between px-6 py-1.5 text-sm border-b last:border-0"
              >
                <span>{name ? `${code} - ${name}` : code}</span>
                <span className="ml-2 shrink-0 min-w-[1.5rem] text-center rounded bg-muted px-1.5 py-0.5 text-xs font-bold">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
