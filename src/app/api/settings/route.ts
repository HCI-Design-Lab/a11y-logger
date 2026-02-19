import { NextResponse } from 'next/server';
import { getSettings, setSetting } from '@/lib/db/settings';
import { BatchUpdateSettingsSchema } from '@/lib/validators/settings';

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = BatchUpdateSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues.map((i) => i.message).join('; '),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(result.data)) {
      setSetting(key, value);
    }

    return NextResponse.json({ success: true, data: getSettings() });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update settings', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
