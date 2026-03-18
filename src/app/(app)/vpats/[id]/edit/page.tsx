import { redirect } from 'next/navigation';

export default async function EditVpatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/vpats/${id}`);
}
