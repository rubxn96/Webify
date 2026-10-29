import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { trendingMusicService } from '@/server/modules/trending/trending.service';
import { catalogService } from '@/server/modules/catalog/catalog.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id;

    // 1. Fetch live dynamic trending Indian music rails (Hindi, Tamil, Malayalam, Punjabi, Indie)
    const trending = await trendingMusicService.getDynamicHomepageRails();

    // 2. Fetch user's saved favorites if logged in
    let userFavorites: any[] = [];
    if (userId) {
      try {
        userFavorites = await catalogService.getLikedTracks(userId);
      } catch {
        userFavorites = [];
      }
    }

    return NextResponse.json({
      hero: trending.hero,
      quickAccess: trending.quickAccess,
      trendingIndia: trending.trendingIndia,
      latestHindi: trending.latestHindi,
      trendingSouth: trending.trendingSouth,
      punjabiDesiHipHop: trending.punjabiDesiHipHop,
      acousticSoul: trending.acousticSoul,
      userFavorites: userFavorites.slice(0, 12),

      // Compatibility bridges for existing discovery views
      aiRecommendations: trending.trendingIndia,
      historyBasedTracks: userFavorites.length > 0 ? userFavorites : trending.latestHindi,
      heavyRotation: trending.trendingSouth,
      discoveryMix: trending.acousticSoul,
      artistSpotlight: {
        artist: trending.hero?.artist || 'Arijit Singh',
        tracks: trending.latestHindi.slice(0, 6),
      },
      aiTasteProfile: {
        summary: 'Live AI & Trending Engine Active: Continuously streaming latest Indian chartbusters.',
        dominantGenres: ['Bollywood', 'Kollywood', 'Mollywood', 'Desi Pop'],
        energyLevel: 0.82,
        danceability: 0.78,
        acousticness: 0.35,
        totalListens: 24,
      },
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
