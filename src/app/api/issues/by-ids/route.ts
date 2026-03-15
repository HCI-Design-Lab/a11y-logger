import { NextResponse } from 'next/server';
import { getIssuesByIds } from '@/lib/db/issues';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : [];
  const issues = getIssuesByIds(ids);
  return NextResponse.json({ success: true, data: issues });
}
