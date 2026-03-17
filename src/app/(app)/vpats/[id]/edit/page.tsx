'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditVpatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  useEffect(() => {
    router.replace(`/vpats/${params.id}`);
  }, [router, params.id]);
  return null;
}
