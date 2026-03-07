'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ImportPreview {
  projectName: string;
  assessmentCount: number;
  issueCount: number;
  file: File;
}

export function ImportProjectButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      if (!zip.files['project.json']) {
        toast.error('Invalid export: missing project.json');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      const projectText = await zip.files['project.json']!.async('text');
      const exportData = JSON.parse(projectText);

      setPreview({
        projectName: exportData.project?.name ?? 'Unknown Project',
        assessmentCount: exportData.assessments?.length ?? 0,
        issueCount: exportData.issues?.length ?? 0,
        file,
      });
    } catch {
      toast.error('Failed to read zip file');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', preview.file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Import failed');

      toast.success('Project imported successfully');
      setPreview(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import project';
      toast.error(message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import project zip file"
      />
      <Button variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {loading ? 'Importing...' : 'Import'}
      </Button>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Project?</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 py-2">
              <div>
                <span className="text-sm text-muted-foreground">Project</span>
                <p className="font-medium">{preview.projectName}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Assessments</span>
                  <p className="font-medium">{preview.assessmentCount}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Issues</span>
                  <p className="font-medium">{preview.issueCount}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
