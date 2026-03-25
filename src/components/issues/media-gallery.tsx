'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaGalleryProps {
  urls: string[];
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

function getFileName(url: string): string {
  return url.split('/').pop() ?? url;
}

export function MediaGallery({ urls }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Tracks the last valid index for rendering during the Dialog close animation,
  // when selectedIndex becomes null before the content unmounts.
  const [displayIndex, setDisplayIndex] = useState(0);

  if (urls.length === 0) return null;

  const isOpen = selectedIndex !== null;
  // displayIndex is always kept in-bounds by openAt/prev/next
  const selected = urls[displayIndex]!;
  const fileName = getFileName(selected);
  const isVideo = isVideoUrl(selected);

  function openAt(idx: number) {
    setDisplayIndex(idx);
    setSelectedIndex(idx);
  }

  function prev() {
    const next = (displayIndex - 1 + urls.length) % urls.length;
    setDisplayIndex(next);
    setSelectedIndex(next);
  }

  function next() {
    const next = (displayIndex + 1) % urls.length;
    setDisplayIndex(next);
    setSelectedIndex(next);
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 gap-3">
        {urls.map((url, idx) => {
          const name = getFileName(url);
          const video = isVideoUrl(url);
          return (
            <Button
              key={`${url}-${idx}`}
              type="button"
              variant="ghost"
              onClick={() => openAt(idx)}
              aria-label={`Open ${name}`}
              className="relative overflow-hidden rounded-md p-0 h-auto w-full"
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
            </Button>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
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
              <Button
                type="button"
                variant="ghost"
                onClick={prev}
                aria-label="Previous media"
                className="absolute left-0 z-10 h-10 w-10 rounded-full bg-black/50 p-0 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}

            {isVideo ? (
              <video
                key={selected}
                src={selected}
                controls
                className="max-h-[80vh] w-full object-contain"
                aria-label={fileName}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected} alt={fileName} className="max-h-[80vh] w-full object-contain" />
            )}

            {urls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={next}
                aria-label="Next media"
                className="absolute right-0 z-10 h-10 w-10 rounded-full bg-black/50 p-0 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">{fileName}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
