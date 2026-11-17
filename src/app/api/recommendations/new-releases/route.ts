import { NextRequest, NextResponse } from 'next/server';
import { trendingRecommender } from '@/server/recommendation/trending';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(40, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '16', 10)));
    const tracks = await trendingRecommender.getNewlyReleasedSongs(limit);

    return NextResponse.json(
      { tracks, count: tracks.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API new-releases] error:', error);
    return NextResponse.json({ error: 'Failed to retrieve new releases' }, { status: 500 });
  }
}

