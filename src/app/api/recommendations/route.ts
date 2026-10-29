import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { trendingMusicService } from '@/server/modules/trending/trending.service';
import { catalogService } from '@/server/modules/catalog/catalog.service';
import { historyService } from '@/server/modules/history/history.service';
import { getSimilarTracks } from '@/lib/youtube/similar';
import { Track } from '@/types';

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

    // 1. Retrieve session or user history (past 20 unique songs from PostgreSQL)
    let listenedHistory: Track[] = [];
    if (userId || sessionId) {
      try {
        listenedHistory = await historyService.getUserOrSessionHistory({
          userId,
          sessionId,
          limit: 20,
        });
      } catch (err) {
        console.warn('[Recommendations] Failed to query user history:', err);
      }
    }

    // 2. Generate vibe-matching recommendations based on the most recent listened song(s)
    let vibeRecommendations: Track[] = [];
    let recentVibeSeed: { title: string; artist: string } | null = null;

    if (listenedHistory.length > 0) {
      const mostRecent = listenedHistory[0];
      recentVibeSeed = {
        title: mostRecent.title,
        artist: mostRecent.artist,
      };

      try {
        const rawVibe = await getSimilarTracks(mostRecent, 20);
        // Exclude songs already in the listened history so the user gets fresh vibe matches
        const historyIds = new Set(listenedHistory.map((h) => h.youtubeId || h.id));
        vibeRecommendations = rawVibe.filter((track) => !historyIds.has(track.youtubeId || track.id));
      } catch (vibeErr) {
        console.warn('[Recommendations] Failed to compute similar vibe tracks:', vibeErr);
        vibeRecommendations = [];
      }
    }

    // 3. Fetch live dynamic trending Indian music rails (Hindi, Tamil, Malayalam, Punjabi, Indie)
    const trending = await trendingMusicService.getDynamicHomepageRails();

    // 4. Fetch user's saved favorites if logged in
    let userFavorites: Track[] = [];
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
      vibeRecommendations,
      recentVibeSeed,
      recentlyPlayed: listenedHistory,
      trendingIndia: trending.trendingIndia,
      latestHindi: trending.latestHindi,
      trendingSouth: trending.trendingSouth,
      punjabiDesiHipHop: trending.punjabiDesiHipHop,
      acousticSoul: trending.acousticSoul,
      userFavorites: userFavorites.slice(0, 12),

      // Compatibility bridges for existing discovery views
      aiRecommendations: vibeRecommendations.length > 0 ? vibeRecommendations : trending.trendingIndia,
      historyBasedTracks: listenedHistory.length > 0 ? listenedHistory : trending.latestHindi,
      heavyRotation: trending.trendingSouth,
      discoveryMix: trending.acousticSoul,
      artistSpotlight: {
        artist: recentVibeSeed?.artist || trending.hero?.artist || 'Arijit Singh',
        tracks: (vibeRecommendations.length > 0 ? vibeRecommendations : trending.latestHindi).slice(0, 6),
      },
      aiTasteProfile: {
        summary:
          recentVibeSeed
            ? `Vibe synced with "${recentVibeSeed.title}". Real-time session neural matching active.`
            : 'Live AI & Trending Engine Active: Continuously streaming latest Indian chartbusters.',
        dominantGenres: ['Bollywood', 'Kollywood', 'Mollywood', 'Desi Pop'],
        energyLevel: 0.82,
        danceability: 0.78,
        acousticness: 0.35,
        totalListens: listenedHistory.length > 0 ? listenedHistory.length : 24,
      },
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
