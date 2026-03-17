import { redirect } from 'next/navigation';

export default function EditVpatPage({ params }: { params: { id: string } }) {
  redirect(`/vpats/${params.id}`);
}
