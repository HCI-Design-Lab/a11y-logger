'use client';
import { useRouter } from 'next/navigation';
import { ImportIssuesModal } from './import-issues-modal';

interface ImportIssuesButtonProps {
  projectId: string;
  assessmentId: string;
}

export function ImportIssuesButton({ projectId, assessmentId }: ImportIssuesButtonProps) {
  const router = useRouter();
  return (
    <ImportIssuesModal
      projectId={projectId}
      assessmentId={assessmentId}
      onImportComplete={() => router.refresh()}
    />
  );
}
