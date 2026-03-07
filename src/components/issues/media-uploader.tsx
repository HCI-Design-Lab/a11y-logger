'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

const VIDEO_EXTENSIONS = ['.mp4', '.webm'];

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
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type "${file.type}" is not allowed. Please upload an image or video file.`);
      return;
    }

    // Client-side size validation
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setUploading(true);

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
        setError(body.error ?? 'Upload failed. Please try again.');
      }
    } catch {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected after an error
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails for existing media */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative">
              {isVideoUrl(url) ? (
                <video
                  src={url}
                  className="h-24 w-24 rounded object-cover"
                  controls
                  aria-label="Uploaded video"
                />
              ) : (
                <Image
                  src={url}
                  alt="Uploaded media"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 rounded object-cover"
                />
              )}
              {onRemove &&
                (() => {
                  const fileName = url.split('/').pop() ?? url;
                  return (
                    <button
                      type="button"
                      aria-label={`Remove ${fileName}`}
                      onClick={() => onRemove(url)}
                      className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white opacity-80 hover:opacity-100"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  );
                })()}
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Upload zone */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-muted/30"
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload media"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        }}
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
        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4 up to 10MB</p>
        <label htmlFor="media-file-input" className="sr-only">
          Choose file
        </label>
        <input
          id="media-file-input"
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          disabled={disabled || uploading}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Choose file"
        />
      </div>
    </div>
  );
}
