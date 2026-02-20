'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublishReportButtonProps {
  reportId: string;
  isPublished: boolean;
}

export function PublishReportButton({ reportId, isPublished }: PublishReportButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to publish report');
        return;
      }
      toast.success('Report published');
      router.refresh();
    } catch {
      toast.error('Failed to publish report');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnpublish() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/publish`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to unpublish report');
        return;
      }
      toast.success('Report unpublished');
      router.refresh();
    } catch {
      toast.error('Failed to unpublish report');
    } finally {
      setIsLoading(false);
    }
  }

  if (isPublished) {
    return (
      <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={isLoading}>
        <SendHorizonal className="mr-2 h-4 w-4" />
        {isLoading ? 'Unpublishing…' : 'Unpublish'}
      </Button>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={handlePublish} disabled={isLoading}>
      <Send className="mr-2 h-4 w-4" />
      {isLoading ? 'Publishing…' : 'Publish'}
    </Button>
  );
}
