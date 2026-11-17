import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { hybridEngine } from '@/server/recommendation/hybridEngine';

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

    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));

    const tracks = await hybridEngine.getHybridRecommendations({
      userId,
      sessionId,
      limit,
    });

    return NextResponse.json(
      { tracks, count: tracks.length },
      {
        headers: {
          'Cache-Control': 'private, max-age=180, stale-while-revalidate=360',
        },
      }
    );
  } catch (error) {
    console.error('[API for-you] error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}

