'use client';

import Link from 'next/link';
import {
  Settings,
  Plus,
  Upload,
  Pencil,
  CirclePlay,
  CircleCheck,
  Ban,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportIssuesModal } from '@/components/issues/import-issues-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AssessmentSettingsMenuProps {
  projectId: string;
  assessmentId: string;
  currentStatus?: 'ready' | 'in_progress' | 'completed';
}

const statusTransition = {
  ready: { next: 'in_progress', label: 'Mark as In Progress', Icon: CirclePlay },
  in_progress: { next: 'completed', label: 'Mark as Complete', Icon: CircleCheck },
  completed: { next: 'in_progress', label: 'Mark as Incomplete', Icon: Ban },
} as const;

export function AssessmentSettingsMenu({
  projectId,
  assessmentId,
  currentStatus,
}: AssessmentSettingsMenuProps) {
  const router = useRouter();
  const tMenu = useTranslations('assessments.settings_menu');
  const tDialog = useTranslations('assessments.delete_dialog');
  const tToast = useTranslations('assessments.toast');
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}`;

  async function handleStatusTransition() {
    if (!currentStatus) return;
    const { next } = statusTransition[currentStatus];
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(tToast('updated'));
        router.refresh();
      } else {
        toast.error(tToast('update_failed'));
      }
    } catch {
      toast.error(tToast('update_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('delete_failed'));
        return;
      }
      toast.success(tToast('deleted'));
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      toast.error(tToast('delete_failed'));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  const transition = currentStatus ? statusTransition[currentStatus] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={tMenu('aria_label')}>
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {transition && (
            <>
              <DropdownMenuItem onSelect={handleStatusTransition} disabled={loading}>
                <transition.Icon className="mr-2 h-4 w-4" />
                {transition.label}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
              {tMenu('edit')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="">
            <Trash2 className="mr-2 h-4 w-4" />
            {tMenu('delete')}
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDialog('title')}</AlertDialogTitle>
            <AlertDialogDescription>{tDialog('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tDialog('cancel_button')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {tDialog('confirm_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
