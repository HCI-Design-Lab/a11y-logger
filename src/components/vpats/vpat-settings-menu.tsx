'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Settings, Send, Download, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { PdfExportModal } from './pdf-export-modal';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface VpatSettingsMenuProps {
  vpatId: string;
  vpatTitle: string;
  status: 'draft' | 'reviewed' | 'published';
  resolvedCount: number;
  totalCount: number;
  isPublishing: boolean;
  isReviewing: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onReview: (reviewerName: string) => void;
  onEdit?: () => void;
  variant?: 'view' | 'edit';
}

/**
 * VpatSettingsMenu — Settings gear menu that drives the VPAT lifecycle.
 *
 * The VPAT moves through three states: draft → reviewed → published. Each
 * transition has guard conditions (all criteria evaluated, review submitted)
 * that are enforced here via separate AlertDialog modals rather than
 * disabling menu items, so users receive an explanation instead of a silent
 * no-op.
 *
 * State machine summary:
 *  - "Mark as Reviewed" — requires all criteria evaluated; captures reviewer name.
 *  - "Publish" — requires reviewed status AND all criteria evaluated; creates a
 *    version snapshot in the parent.
 *  - "Unpublish" — resets to draft while preserving the published snapshot in
 *    version history.
 *  - "Edit" (view variant, published) — warns that editing resets to draft
 *    before navigating to the edit route.
 *
 * Export options (HTML, Word, OpenACR YAML) are always available regardless of
 * status so auditors can share in-progress drafts.
 *
 * @param vpatId - VPAT record ID used for API calls and export URLs.
 * @param vpatTitle - Display name shown in the delete confirmation.
 * @param status - Current lifecycle status of the VPAT.
 * @param resolvedCount - Number of criteria that have a conformance value set.
 * @param totalCount - Total number of criteria rows in this VPAT.
 * @param isPublishing - True while the publish API call is in-flight.
 * @param isReviewing - True while the review API call is in-flight.
 * @param onPublish - Triggers the publish transition in the parent.
 * @param onUnpublish - Triggers the unpublish transition in the parent.
 * @param onReview - Called with the reviewer's name to record the review.
 * @param onEdit - Called when the user confirms editing a published VPAT.
 * @param variant - "view" adds an Edit VPAT menu item; omit on the edit page.
 */
export function VpatSettingsMenu({
  vpatId,
  vpatTitle,
  status,
  resolvedCount,
  totalCount,
  isPublishing,
  isReviewing,
  onPublish,
  onUnpublish,
  onReview,
  onEdit,
  variant,
}: VpatSettingsMenuProps) {
  const router = useRouter();
  const t = useTranslations('vpats.settings_menu');
  const tToast = useTranslations('vpats.toast');
  const notEvaluated = totalCount - resolvedCount;
  const isPublished = status === 'published';
  const countText =
    notEvaluated === 0
      ? t('all_criteria_evaluated', { total: totalCount })
      : t('criteria_not_evaluated', { notEvaluated, total: totalCount });

  const [publishOpen, setPublishOpen] = useState(false);
  const [notReadyOpen, setNotReadyOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [reviewNotReadyOpen, setReviewNotReadyOpen] = useState(false);
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const reviewerInputRef = useRef<HTMLInputElement>(null);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? tToast('delete_failed'));
        return;
      }
      toast.success(tToast('deleted'));
      router.push('/vpats');
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
          <Button variant="ghost" size="icon" aria-label={t('aria_label')}>
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {variant === 'view' && (
            <>
              {/* Published VPATs cannot be navigated to directly — editing one
                  requires the user to confirm they understand it resets to draft. */}
              <DropdownMenuItem
                asChild={!isPublished}
                onSelect={isPublished ? () => setEditOpen(true) : undefined}
              >
                {isPublished ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('edit_vpat')}
                  </>
                ) : (
                  <Link href={`/vpats/${vpatId}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('edit_vpat')}
                  </Link>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {/* Guard: all criteria must be evaluated before the reviewer dialog opens. */}
          <DropdownMenuItem
            onSelect={() => {
              if (notEvaluated > 0) {
                setReviewNotReadyOpen(true);
              } else {
                setReviewConfirmOpen(true);
              }
            }}
            disabled={isReviewing}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {status === 'draft' ? t('mark_as_reviewed') : t('update_review')}
          </DropdownMenuItem>
          {/* Publish guard: must be reviewed AND fully evaluated. If already
              published, route to the unpublish confirmation instead. */}
          <DropdownMenuItem
            onSelect={() => {
              if (isPublished) {
                setUnpublishOpen(true);
              } else if (notEvaluated > 0 || status !== 'reviewed') {
                setNotReadyOpen(true);
              } else {
                setPublishOpen(true);
              }
            }}
            disabled={isPublishing}
          >
            <Send className="mr-2 h-4 w-4" />
            {isPublished ? t('unpublish') : t('publish')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href={`/api/vpats/${vpatId}/export?format=html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('export_html')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/vpats/${vpatId}/export?format=docx`}>
              <Download className="mr-2 h-4 w-4" />
              {t('export_docx')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/vpats/${vpatId}/export?format=openacr`}>
              <Download className="mr-2 h-4 w-4" />
              {t('export_openacr')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPdfOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            {t('print_to_pdf')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Not ready to publish */}
      <AlertDialog open={notReadyOpen} onOpenChange={setNotReadyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('not_ready_to_publish_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>{countText}</p>
                {notEvaluated > 0 && <p>{t('criteria_must_be_evaluated')}</p>}
                {status !== 'reviewed' && notEvaluated === 0 && <p>{t('vpat_must_be_reviewed')}</p>}
                {status !== 'reviewed' && notEvaluated > 0 && (
                  <p>{t('vpat_must_also_be_reviewed')}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ok')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish confirmation */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('publish_vpat_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>{countText}</p>
                <p>{t('publish_snapshot_note')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'success' })}
              onClick={() => {
                setPublishOpen(false);
                onPublish();
              }}
              disabled={isPublishing}
            >
              {isPublishing ? t('publishing') : t('publish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish confirmation */}
      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unpublish_vpat_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unpublish_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setUnpublishOpen(false);
                onUnpublish();
              }}
            >
              {t('unpublish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Not ready to review */}
      <AlertDialog open={reviewNotReadyOpen} onOpenChange={setReviewNotReadyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('not_ready_to_review_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>{countText}</p>
                <p>{t('criteria_must_be_evaluated_review')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ok')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit review confirmation */}
      {/* Clear the reviewer name whenever the dialog closes so it does not
          persist if the user dismisses and re-opens without submitting. */}
      <AlertDialog
        open={reviewConfirmOpen}
        onOpenChange={(open) => {
          setReviewConfirmOpen(open);
          if (!open) setReviewerName('');
        }}
      >
        {/* Radix auto-focuses the cancel button by default; override so the
            reviewer name field is immediately active when the dialog opens. */}
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            reviewerInputRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t('submit_review_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>{countText}</p>
                <p>{t('submit_review_confirmation')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Input
              placeholder={t('reviewer_name_placeholder')}
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              aria-label={t('reviewer_name_aria_label')}
              ref={reviewerInputRef}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'success' })}
              onClick={() => {
                if (!reviewerName.trim()) return;
                setReviewConfirmOpen(false);
                onReview(reviewerName.trim());
                setReviewerName('');
              }}
              disabled={!reviewerName.trim() || isReviewing}
            >
              {isReviewing ? t('submitting') : t('submit_review_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit published confirmation */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('edit_published_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('edit_published_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditOpen(false);
                onEdit?.();
              }}
            >
              {t('edit_anyway')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_vpat_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_vpat_description', { title: vpatTitle })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfExportModal open={pdfOpen} onOpenChange={setPdfOpen} vpatId={vpatId} />
    </>
  );
}
