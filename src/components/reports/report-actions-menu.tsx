'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Settings, Pencil, Send, SendHorizonal, Download, Printer, Trash2 } from 'lucide-react';
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
      if (!json.success) { toast.error(json.error ?? 'Failed to publish report'); return; }
      toast.success('Report published');
      router.refresh();
    } catch {
      toast.error('Failed to publish report');
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
      if (!json.success) { toast.error(json.error ?? 'Failed to unpublish report'); return; }
      toast.success('Report unpublished');
      router.refresh();
    } catch {
      toast.error('Failed to unpublish report');
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to delete report'); return; }
      toast.success('Report deleted');
      router.push('/reports');
      router.refresh();
    } catch {
      toast.error('Failed to delete report');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Report actions">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isPublished && (
            <DropdownMenuItem asChild>
              <Link href={`/reports/${reportId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          {!isPublished ? (
            <DropdownMenuItem onSelect={() => setPublishOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleUnpublish} disabled={isUnpublishing}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              {isUnpublishing ? 'Unpublishing…' : 'Unpublish'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${reportId}/export?format=html`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              HTML — Default
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${reportId}/export?format=html&variant=with-chart`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              HTML — With Chart
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${reportId}/export?format=html&variant=with-issues`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              HTML — With Issues
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${reportId}/export?format=html&variant=with-all`} target="_blank" rel="noopener noreferrer">
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
            <a href={`/api/reports/${reportId}/export?autoprint=true`} target="_blank" rel="noopener noreferrer">
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Publish confirmation */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Report</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, this report cannot be edited. Are you sure you want to publish?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing…' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{reportTitle}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
