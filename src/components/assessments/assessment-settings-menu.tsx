'use client';

import Link from 'next/link';
import { Settings, Plus, Upload, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportIssuesModal } from '@/components/issues/import-issues-modal';

interface AssessmentSettingsMenuProps {
  projectId: string;
  assessmentId: string;
}

export function AssessmentSettingsMenu({ projectId, assessmentId }: AssessmentSettingsMenuProps) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Assessment settings">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/issues/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Issue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Issues
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Assessment
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportIssuesModal
        projectId={projectId}
        assessmentId={assessmentId}
        onImportComplete={() => router.refresh()}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </>
  );
}
