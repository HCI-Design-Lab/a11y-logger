'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggle } from '@/components/ui/view-toggle';
import { AllAssessmentsTable } from '@/components/assessments/all-assessments-table';
import { AssessmentCard } from '@/components/assessments/assessment-card';
import type { AssessmentWithProject } from '@/lib/db/assessments';

interface AssessmentsListViewProps {
  assessments: AssessmentWithProject[];
}

export function AssessmentsListView({ assessments }: AssessmentsListViewProps) {
  const t = useTranslations('assessments.list');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as 'ready' | 'in_progress' | 'completed' | null;

  const filtered =
    status && (['ready', 'in_progress', 'completed'] as const).includes(status)
      ? assessments.filter((a) => a.status === status)
      : assessments;

  return (
    <div className="p-6 space-y-6">
      <section aria-labelledby="assessments-heading">
        <div className="flex items-center justify-between">
          <h1 id="assessments-heading" className="text-lg font-semibold">
            {t('page_title')}
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="success">
              <Link href="/assessments/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('new_button')}
              </Link>
            </Button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t('empty_heading')}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/assessments/new">{t('create_first')}</Link>
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {filtered.map((a) => (
            <AssessmentCard key={a.id} assessment={a} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <AllAssessmentsTable assessments={filtered} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
