'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PdfExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vpatId: string;
}

/**
 * PdfExportModal — Explains browser-PDF accessibility limitations before
 * triggering window.print() via the existing HTML export.
 *
 * "Continue to Print": fetches /api/vpats/[vpatId]/export?format=html,
 * opens the blob in a new tab, then calls window.print() on that tab.
 *
 * "Download DOCX instead": navigates to the DOCX export URL and closes the
 * modal — recommended for accessible PDF output via Word/LibreOffice.
 */
export function PdfExportModal({ open, onOpenChange, vpatId }: PdfExportModalProps) {
  const t = useTranslations('vpats.pdf_modal');

  async function handlePrint() {
    const res = await fetch(`/api/vpats/${vpatId}/export?format=html`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url);
    if (newWindow) {
      newWindow.focus();
      newWindow.addEventListener('load', () => {
        newWindow.print();
      });
    }
  }

  function handleDocx() {
    window.location.href = `/api/vpats/${vpatId}/export?format=docx`;
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{t('browser_warning')}</p>
              <p>{t('accessible_alternative')}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDocx}>
            {t('download_docx')}
          </Button>
          <Button onClick={handlePrint}>{t('continue_to_print')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
