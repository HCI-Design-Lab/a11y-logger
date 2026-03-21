import { NextResponse } from 'next/server';
import { getIssuesByProjectAndWcagCode } from '@/lib/db/issues';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const wcagCode = url.searchParams.get('wcagCode');

  if (!projectId || !wcagCode) {
    return NextResponse.json(
      { success: false, error: 'projectId and wcagCode are required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const issues = await getIssuesByProjectAndWcagCode(projectId, wcagCode);
  return NextResponse.json({ success: true, data: issues });
}
