import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { discoverEngine } from '@/server/recommendation/discoverEngine';
import { catalogService } from '@/server/modules/catalog/catalog.service';

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

    // Generate comprehensive hybrid recommendations with all 10 sections
    const feed = await discoverEngine.getFullDiscoveryFeed({
      userId,
      sessionId,
    });

    // Fetch user's saved favorites if logged in
    let userFavorites: any[] = [];
    if (userId) {
      try {
        userFavorites = await catalogService.getLikedTracks(userId);
      } catch {
        userFavorites = [];
      }
    }

    const payload = {
      ...feed,
      userFavorites: userFavorites.slice(0, 12),
      // Complementary keys for existing view models
      aiRecommendations: feed.madeForYou,
      historyBasedTracks: feed.recentlyPlayed || [],
      heavyRotation: feed.dailyMix.slice(0, 8),
      discoveryMix: feed.hiddenGems,
      artistSpotlight: {
        artist: feed.discoverNewArtists[0]?.artist || feed.hero?.artist || 'Arijit Singh',
        tracks: feed.discoverNewArtists[0]?.tracks || feed.recommendedForYou.slice(0, 6),
      },
      aiTasteProfile: {
        summary: feed.recentVibeSeed?.summary || 'Hybrid Recommendation Engine active: Real-time neural matching.',
        dominantGenres: ['Bollywood', 'Kollywood', 'Mollywood', 'Indie', 'Acoustic'],
        energyLevel: 0.82,
        danceability: 0.78,
        acousticness: 0.35,
        totalListens: feed.recentlyPlayed?.length || 24,
      },
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=180, stale-while-revalidate=360',
      },
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
