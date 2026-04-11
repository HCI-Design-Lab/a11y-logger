'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Settings, Pencil, Send, SendHorizonal, Download, Printer, Trash2, X } from 'lucide-react';
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

interface ReportActionsMenuProps {
  reportId: string;
  reportTitle: string;
  isPublished: boolean;
}

export function ReportActionsMenu({ reportId, reportTitle, isPublished }: ReportActionsMenuProps) {
  const router = useRouter();
  const tMenu = useTranslations('reports.settings_menu');
  const tDelete = useTranslations('reports.delete_dialog');
  const tPublish = useTranslations('reports.publish_dialog');
  const tToast = useTranslations('reports.toast');
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('update_failed'));
        return;
      }
      toast.success(tToast('published'));
      router.refresh();
    } catch {
      toast.error(tToast('update_failed'));
    } finally {
      setIsPublishing(false);
      setPublishOpen(false);
    }
  }

  async function handleUnpublish() {
    setIsUnpublishing(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('update_failed'));
        return;
      }
      toast.success(tToast('unpublished'));
      router.refresh();
    } catch {
      toast.error(tToast('update_failed'));
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('delete_failed'));
        return;
      }
      toast.success(tToast('deleted'));
      router.push('/reports');
      router.refresh();
    } catch {
      toast.error(tToast('delete_failed'));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={tMenu('aria_label')}>
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isPublished && (
            <DropdownMenuItem asChild>
              <Link href={`/reports/${reportId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {tMenu('edit')}
              </Link>
            </DropdownMenuItem>
          )}
          {!isPublished ? (
            <DropdownMenuItem onSelect={() => setPublishOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              {tMenu('publish')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleUnpublish} disabled={isUnpublishing}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              {tMenu('unpublish')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href={`/api/reports/${reportId}/export?format=html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              HTML — Default
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`/api/reports/${reportId}/export?format=html&variant=with-chart`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              HTML — With Chart
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`/api/reports/${reportId}/export?format=html&variant=with-issues`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              HTML — With Issues
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`/api/reports/${reportId}/export?format=html&variant=with-all`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              HTML — All (Chart + Issues)
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${reportId}/export?format=docx`}>
              <Download className="mr-2 h-4 w-4" />
              Word (.docx)
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`/api/reports/${reportId}/export?autoprint=true`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="">
            <Trash2 className="mr-2 h-4 w-4" />
            {tMenu('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Publish confirmation */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPublish('title')}</AlertDialogTitle>
            <AlertDialogDescription>{tPublish('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <X />
              {tPublish('cancel_button')}
            </AlertDialogCancel>
            <AlertDialogAction variant="success" onClick={handlePublish} disabled={isPublishing}>
              <Send />
              {tPublish('confirm_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDelete('title', { name: reportTitle })}</AlertDialogTitle>
            <AlertDialogDescription>{tDelete('description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tDelete('cancel_button')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {tDelete('confirm_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
