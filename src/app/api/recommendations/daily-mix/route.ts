import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { discoverEngine } from '@/server/recommendation/discoverEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id;
    const sessionId =
      req.cookies.get('webify_session_id')?.value ||
      req.headers.get('x-session-id') ||
      req.nextUrl.searchParams.get('sessionId') ||
      undefined;

    const fullFeed = await discoverEngine.getFullDiscoveryFeed({ userId, sessionId });

    return NextResponse.json(
      { tracks: fullFeed.dailyMix, count: fullFeed.dailyMix.length },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API daily-mix] error:', error);
    return NextResponse.json({ error: 'Failed to retrieve daily mix' }, { status: 500 });
  }
}

