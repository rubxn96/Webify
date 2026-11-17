import { NextRequest, NextResponse } from 'next/server';
import { trendingRecommender } from '@/server/recommendation/trending';
import { IndianLanguage, SUPPORTED_INDIAN_LANGUAGES } from '@/server/metadata/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const langParam = req.nextUrl.searchParams.get('language')?.toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));

    let tracks;
    if (langParam && SUPPORTED_INDIAN_LANGUAGES.includes(langParam as IndianLanguage)) {
      tracks = await trendingRecommender.getTrendingByLanguage(langParam as IndianLanguage, limit);
    } else {
      tracks = await trendingRecommender.getTrendingIndianSongs(limit);
    }

    return NextResponse.json(
      { language: langParam || 'all', tracks, count: tracks.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API trending] error:', error);
    return NextResponse.json({ error: 'Failed to retrieve trending songs' }, { status: 500 });
  }
}

