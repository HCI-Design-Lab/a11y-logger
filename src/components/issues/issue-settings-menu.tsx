'use client';

import Link from 'next/link';
import { Settings, Pencil, Trash2, X, CircleCheck, Ban } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface IssueSettingsMenuProps {
  projectId: string;
  assessmentId: string;
  issueId: string;
  issueTitle: string;
  currentStatus?: 'open' | 'resolved' | 'wont_fix';
}

const statusTransition = {
  open: { next: 'resolved', labelKey: 'mark_complete' as const, Icon: CircleCheck },
  resolved: { next: 'open', labelKey: 'mark_open' as const, Icon: Ban },
  wont_fix: { next: 'open', labelKey: 'mark_open' as const, Icon: Ban },
} as const;

export function IssueSettingsMenu({
  projectId,
  assessmentId,
  issueId,
  issueTitle,
  currentStatus,
}: IssueSettingsMenuProps) {
  const router = useRouter();
  const tMenu = useTranslations('issues.settings_menu');
  const tDialog = useTranslations('issues.delete_dialog');
  const tToast = useTranslations('issues.toast');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`;

  async function handleStatusTransition() {
    if (!currentStatus) return;
    const { next } = statusTransition[currentStatus];
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        }
      );
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
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(tToast('deleted'));
      router.push(`/projects/${projectId}/assessments/${assessmentId}`);
    } catch {
      toast.error(tToast('delete_failed'));
      setLoading(false);
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
                {tMenu(transition.labelKey)}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {tMenu('edit')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {tMenu('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDialog('title', { name: issueTitle })}</AlertDialogTitle>
            <AlertDialogDescription>{tDialog('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <X className="h-4 w-4" />
              {tDialog('cancel_button')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4" />
              {tDialog('confirm_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
