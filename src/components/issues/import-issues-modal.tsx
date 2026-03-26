'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMPORTABLE_ISSUE_FIELDS, type ImportableFieldKey } from '@/lib/constants/csv-import';

interface ImportIssuesModalProps {
  projectId: string;
  assessmentId: string;
  onImportComplete: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'upload' | 'mapping';

const SKIP = '__skip__';

export function ImportIssuesModal({
  projectId,
  assessmentId,
  onImportComplete,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: ImportIssuesModalProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onControlledOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportableFieldKey, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setPreviewRows([]);
    setMapping({});
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        setCsvHeaders(headers);
        setCsvRows(result.data);
        setPreviewRows(result.data.slice(0, 3));

        // Auto-match by name
        const autoMapping: Partial<Record<ImportableFieldKey, string>> = {};
        for (const field of IMPORTABLE_ISSUE_FIELDS) {
          const match = headers.find(
            (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '_') === field.key
          );
          if (match) autoMapping[field.key] = match;
        }
        setMapping(autoMapping);
      },
    });
  }

  async function handleImport() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/assessments/${assessmentId}/issues/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: csvRows, mapping }),
        }
      );
      if (res.ok) {
        handleClose();
        onImportComplete();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Import failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isControlled && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="max-w-4xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{step === 'upload' ? 'Upload CSV' : 'Map Columns'}</DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="csv-file-input" className="block text-sm font-medium mb-1">
                  CSV File
                </label>
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm"
                />
              </div>

              {previewRows.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Preview ({csvRows.length} rows)</p>
                  <div className="overflow-auto rounded border text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          {csvHeaders.map((h) => (
                            <th key={h} className="px-2 py-1 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-t">
                            {csvHeaders.map((h) => (
                              <td key={h} className="px-2 py-1 truncate max-w-[120px]">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 text-sm font-medium text-muted-foreground pb-1 border-b">
                <span>Issue Field</span>
                <span>CSV Column</span>
              </div>
              {IMPORTABLE_ISSUE_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-sm">{field.label}</span>
                  <Select
                    value={mapping[field.key] ?? SKIP}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: val === SKIP ? undefined : val,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="— skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>— skip —</SelectItem>
                      {csvHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="cancel" onClick={handleClose}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            {step === 'upload' && (
              <Button onClick={() => setStep('mapping')} disabled={csvRows.length === 0}>
                <ArrowRight className="h-4 w-4" />
                Next
              </Button>
            )}
            {step === 'mapping' && (
              <Button onClick={handleImport} disabled={loading}>
                <Upload className="h-4 w-4" />
                {loading ? 'Importing…' : `Import ${csvRows.length} rows`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
