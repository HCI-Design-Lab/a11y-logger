'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MediaGalleryProps {
  urls: string[];
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function getFileName(url: string): string {
  return url.split('/').pop() ?? url;
}

export function MediaGallery({ urls }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  const isOpen = selectedIndex !== null;
  const selected = isOpen ? urls[selectedIndex] : null;
  const fileName = selected ? getFileName(selected) : '';
  const isVideo = selected ? isVideoUrl(selected) : false;

  function prev() {
    setSelectedIndex((i) => (i === null ? 0 : (i - 1 + urls.length) % urls.length));
  }

  function next() {
    setSelectedIndex((i) => (i === null ? 0 : (i + 1) % urls.length));
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 gap-3">
        {urls.map((url, idx) => {
          const name = getFileName(url);
          const video = isVideoUrl(url);
          return (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Open ${name}`}
              className="relative overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {video ? (
                <div className="relative aspect-video w-full bg-black">
                  {}
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    aria-hidden="true"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="h-8 w-8"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={name} className="aspect-video w-full object-cover" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent
          className="max-w-4xl p-4"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
          }}
        >
          <DialogTitle className="sr-only">{fileName}</DialogTitle>
          <div className="relative flex items-center justify-center">
            {urls.length > 1 && (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous media"
                className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {isVideo ? (
              <video
                key={selected}
                src={selected ?? ''}
                controls
                className="max-h-[80vh] w-full object-contain"
                aria-label={fileName}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected ?? ''}
                alt={fileName}
                className="max-h-[80vh] w-full object-contain"
              />
            )}

            {urls.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label="Next media"
                className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">{fileName}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
