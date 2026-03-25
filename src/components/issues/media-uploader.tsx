'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

interface MediaUploaderProps {
  projectId: string;
  issueId: string;
  urls: string[];
  onUpload: (url: string) => void;
  onRemove?: (url: string) => void;
  disabled?: boolean;
}

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
}

export function MediaUploader({
  projectId,
  issueId,
  urls,
  onUpload,
  onRemove,
  disabled = false,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setUploading(true);

    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": file type not allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}": file too large (max 10MB).`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('issueId', issueId);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const body = await response.json();

        if (body.success) {
          onUpload(body.data.url);
        } else {
          errors.push(`"${file.name}": ${body.error ?? 'upload failed.'}`);
        }
      } catch {
        errors.push(`"${file.name}": upload failed. Please check your connection.`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    setUploading(false);
    // Reset the input so the same files can be re-selected after an error
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails for existing media */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => {
            const fileName = url.split('/').pop() ?? url;
            return (
              <div key={url} className="relative">
                {isVideoUrl(url) ? (
                  <video
                    src={url}
                    className="h-24 w-24 rounded object-cover"
                    controls
                    aria-label={fileName}
                  />
                ) : (
                  <Image
                    src={url}
                    alt={fileName}
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Remove ${fileName}`}
                    onClick={() => onRemove(url)}
                    className="absolute right-0 top-0 h-5 w-5 rounded-full bg-gray-800 p-0 text-white opacity-80 hover:bg-gray-800 hover:opacity-100"
                  >
                    <span aria-hidden="true">×</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Upload zone */}
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col h-auto items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary hover:bg-muted/30 hover:text-foreground"
          aria-label="Upload media"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">
            {uploading ? 'Uploading…' : 'Upload screenshots or videos'}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF, WebP, MP4, WebM, MOV up to 10MB
          </p>
        </Button>
        <label htmlFor="media-file-input" className="sr-only">
          Choose file
        </label>
        <input
          id="media-file-input"
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          disabled={disabled || uploading}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Choose file"
        />
        {uploading && (
          <p aria-live="polite" className="sr-only">
            Uploading file…
          </p>
        )}
      </div>
    </div>
  );
}
