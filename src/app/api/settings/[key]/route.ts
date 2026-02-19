import { NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db/settings';
import { SENSITIVE_KEYS } from '@/lib/crypto';
import { UpdateSettingSchema } from '@/lib/validators/settings';

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { key } = await params;
  try {
    const value = getSetting(key);

    if (value === null) {
      return NextResponse.json(
        { success: false, error: 'Setting not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const redacted = (SENSITIVE_KEYS as readonly string[]).includes(key) ? '[REDACTED]' : value;
    return NextResponse.json({ success: true, data: { key, value: redacted } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch setting', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { key } = await params;
  try {
    const body = await request.json();
    const result = UpdateSettingSchema.safeParse(body);

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

    setSetting(key, result.data.value);

    const stored = getSetting(key);
    const redacted = (SENSITIVE_KEYS as readonly string[]).includes(key) ? '[REDACTED]' : stored;
    return NextResponse.json({ success: true, data: { key, value: redacted } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update setting', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
