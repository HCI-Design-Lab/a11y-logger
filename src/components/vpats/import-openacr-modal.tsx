'use client';

import { useState, useRef, useEffect } from 'react';
import jsYaml from 'js-yaml';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { parseOpenAcr, type OpenAcrParseResult } from '@/lib/import/parse-openacr';

interface Project {
  id: string;
  name: string;
}

interface ImportOpenAcrModalProps {
  onImportComplete: (vpatId: string) => void;
}

type Step = 'project' | 'upload' | 'confirm';

export function ImportOpenAcrModal({ onImportComplete }: ImportOpenAcrModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [parsed, setParsed] = useState<OpenAcrParseResult | null>(null);
  const [yamlString, setYamlString] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetch('/api/projects')
        .then((r) => r.json())
        .then((body) => {
          if (body.success) setProjects(body.data);
        })
        .catch(() => {});
    }
  }, [open]);

  function reset() {
    setStep('project');
    setProjectId('');
    setParsed(null);
    setYamlString('');
    setParseError(null);
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
    setParseError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const doc = jsYaml.load(text);
        const result = parseOpenAcr(doc);
        if (!result) {
          setParseError(
            'File does not appear to be a valid OpenACR YAML (missing catalog or chapters).'
          );
          return;
        }
        setYamlString(text);
        setParsed(result);
      } catch {
        setParseError('Could not parse YAML. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vpats/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, yaml: yamlString }),
      });
      const data = await res.json();
      if (res.ok) {
        handleClose();
        onImportComplete(data.data.id);
      } else {
        setError(data.error ?? 'Import failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileUp className="mr-2 h-4 w-4" />
        Import from OpenACR
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {step === 'project' && 'Select Project'}
              {step === 'upload' && 'Upload OpenACR YAML'}
              {step === 'confirm' && 'Confirm Import'}
            </DialogTitle>
          </DialogHeader>

          {step === 'project' && (
            <div className="space-y-2">
              <label htmlFor="import-project-select" className="block text-sm font-medium">
                Project
              </label>
              <select
                id="import-project-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="yaml-file-input" className="block text-sm font-medium mb-1">
                  YAML File
                </label>
                <input
                  id="yaml-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileChange}
                  className="block w-full text-sm"
                />
              </div>
              {parseError && <p className="text-sm text-destructive">{parseError}</p>}
              {parsed && (
                <div className="rounded border p-3 text-sm space-y-1">
                  <p className="font-medium">{parsed.title}</p>
                  <p className="text-muted-foreground">
                    {parsed.standard_edition} · WCAG {parsed.wcag_version} · Level{' '}
                    {parsed.wcag_level}
                  </p>
                  <p className="text-muted-foreground">{parsed.criteria.length} criteria</p>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && parsed && selectedProject && (
            <div className="text-sm space-y-2">
              <p>
                Create VPAT for <strong>{selectedProject.name}</strong> from{' '}
                <strong>{parsed.title}</strong>
              </p>
              <p className="text-muted-foreground">
                {parsed.standard_edition} · WCAG {parsed.wcag_version} · Level {parsed.wcag_level} ·{' '}
                {parsed.criteria.length} criteria
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="cancel" onClick={handleClose}>
              Cancel
            </Button>
            {step === 'project' && (
              <Button size="sm" onClick={() => setStep('upload')} disabled={!projectId}>
                Next
              </Button>
            )}
            {step === 'upload' && (
              <Button size="sm" onClick={() => setStep('confirm')} disabled={!parsed}>
                Next
              </Button>
            )}
            {step === 'confirm' && (
              <Button size="sm" onClick={handleImport} disabled={loading}>
                {loading ? 'Importing…' : 'Import'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
