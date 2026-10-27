import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { DEFAULT_USER_SETTINGS } from '@/lib/audio/dspPresets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ settings: DEFAULT_USER_SETTINGS });
    }

    const settings = user.settings ? JSON.parse(user.settings) : DEFAULT_USER_SETTINGS;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ settings: DEFAULT_USER_SETTINGS }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await req.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings payload required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: JSON.stringify(settings),
      },
    });

    return NextResponse.json({ success: true, settings: JSON.parse(updated.settings || '{}') });
  } catch (error) {
    console.error('Settings sync error:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}
