import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { UserSettingsSchema } from '@/server/middleware/validation';
import { authService, DEFAULT_USER_SETTINGS } from '@/server/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ settings: DEFAULT_USER_SETTINGS });
    }

    const settings = (user.preferences as any) || DEFAULT_USER_SETTINGS;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ settings: DEFAULT_USER_SETTINGS }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const settingsInput = body.settings || body;
    const parsed = UserSettingsSchema.partial().safeParse(settingsInput);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await authService.updatePreferences(user.id, parsed.data);
    return NextResponse.json({ success: true, settings: updated.settings });
  } catch (error) {
    console.error('Settings sync error:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}
