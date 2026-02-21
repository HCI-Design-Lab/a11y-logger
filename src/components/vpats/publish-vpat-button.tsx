'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublishVpatButtonProps {
  vpatId: string;
  isPublished: boolean;
}

export function PublishVpatButton({ vpatId, isPublished }: PublishVpatButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vpats/${vpatId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to publish VPAT');
        return;
      }
      toast.success(isPublished ? 'VPAT re-published' : 'VPAT published');
      router.refresh();
    } catch {
      toast.error('Failed to publish VPAT');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="default" size="sm" onClick={handlePublish} disabled={isLoading}>
      <Send className="mr-2 h-4 w-4" />
      {isLoading ? 'Publishing…' : isPublished ? 'Re-publish' : 'Publish'}
    </Button>
  );
}
