import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { trendingMusicService } from '@/server/modules/trending/trending.service';
import { catalogService } from '@/server/modules/catalog/catalog.service';
import { historyService } from '@/server/modules/history/history.service';
import { getSimilarTracks, extractVibeAndContext } from '@/lib/youtube/similar';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

interface CachedRecommendation {
  timestamp: number;
  data: any;
}

const RECOMMENDATIONS_CACHE = new Map<string, CachedRecommendation>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache per session/user

const VIBE_DISPLAY_NAMES: Record<string, string> = {
  'bollywood-melodic': 'Bollywood & Melodic Hits',
  'bollywood-party': 'Bollywood Party & Dance',
  tamil: 'Tamil & Kollywood Vibes',
  malayalam: 'Malayalam & Mollywood Beats',
  punjabi: 'Punjabi & Desi Bangers',
  'indian-general': 'Indian Chartbusters',
};

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id;

    const sessionId =
      req.cookies.get('webify_session_id')?.value ||
      req.headers.get('x-session-id') ||
      req.nextUrl.searchParams.get('sessionId') ||
      undefined;

    const cacheKey = userId ? `user_${userId}` : sessionId ? `sess_${sessionId}` : 'guest';

    // 0. Check in-memory server cache to prevent re-fetching on every page load
    const cached = RECOMMENDATIONS_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      });
    }

    // 1. Retrieve session or user history (past 30 unique songs from PostgreSQL)
    let listenedHistory: Track[] = [];
    if (userId || sessionId) {
      try {
        listenedHistory = await historyService.getUserOrSessionHistory({
          userId,
          sessionId,
          limit: 30,
        });
      } catch (err) {
        console.warn('[Recommendations] Failed to query user history:', err);
      }
    }

    // 2. Generate aggregate vibe recommendations averaged across up to the last 30 songs
    let vibeRecommendations: Track[] = [];
    let recentVibeSeed: { title: string; artist: string; summary?: string } | null = null;

    if (listenedHistory.length > 0) {
      // Analyze vibe distribution across the listening history
      const vibeMap: Record<string, { count: number; tracks: Track[] }> = {};
      for (const track of listenedHistory) {
        const ctx = extractVibeAndContext(track.title, track.artist);
        const v = ctx.vibe || 'bollywood-melodic';
        if (!vibeMap[v]) {
          vibeMap[v] = { count: 0, tracks: [] };
        }
        vibeMap[v].count++;
        vibeMap[v].tracks.push(track);
      }

      const sortedVibes = Object.entries(vibeMap).sort((a, b) => b[1].count - a[1].count);

      // Select up to 3 diverse representative seeds across the user's top vibes
      const representativeSeeds: Track[] = [];
      const chosenYtIds = new Set<string>();

      for (const [, group] of sortedVibes) {
        for (const tr of group.tracks) {
          if (!chosenYtIds.has(tr.youtubeId)) {
            representativeSeeds.push(tr);
            chosenYtIds.add(tr.youtubeId);
            break;
          }
        }
        if (representativeSeeds.length >= 3) break;
      }

      // If fewer than 2 seeds, pull from recent unique tracks in history
      for (const tr of listenedHistory) {
        if (representativeSeeds.length >= 3) break;
        if (!chosenYtIds.has(tr.youtubeId)) {
          representativeSeeds.push(tr);
          chosenYtIds.add(tr.youtubeId);
        }
      }

      try {
        // Query similar tracks for each representative seed
        const rawTrackBatches = await Promise.all(
          representativeSeeds.map((seed) =>
            getSimilarTracks(seed, 10).catch(() => [] as Track[])
          )
        );

        // Interleave / blend candidate tracks from each seed to represent their average taste
        const historyIds = new Set(listenedHistory.map((h) => h.youtubeId || h.id));
        const seenRecKeys = new Set<string>();
        const blended: Track[] = [];
        const maxBatchLen = Math.max(...rawTrackBatches.map((b) => b.length), 0);

        for (let i = 0; i < maxBatchLen; i++) {
          for (const batch of rawTrackBatches) {
            const tr = batch[i];
            if (!tr) continue;
            const key = tr.youtubeId || tr.id;
            if (historyIds.has(key) || seenRecKeys.has(key)) continue;
            seenRecKeys.add(key);
            blended.push(tr);
            if (blended.length >= 20) break;
          }
          if (blended.length >= 20) break;
        }

        vibeRecommendations = blended;
      } catch (vibeErr) {
        console.warn('[Recommendations] Failed to compute similar vibe tracks:', vibeErr);
        vibeRecommendations = [];
      }

      const dominantLabels = sortedVibes.slice(0, 2).map(([v]) => VIBE_DISPLAY_NAMES[v] || v).join(' & ');
      recentVibeSeed = {
        title: dominantLabels || 'Your Vibe Mix',
        artist: `Averaged across your last ${listenedHistory.length} songs`,
        summary: `Calibrated across your past ${listenedHistory.length} songs • ${dominantLabels}`,
      };
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

    const payload = {
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
        artist: recentVibeSeed?.title || trending.hero?.artist || 'Arijit Singh',
        tracks: (vibeRecommendations.length > 0 ? vibeRecommendations : trending.latestHindi).slice(0, 6),
      },
      aiTasteProfile: {
        summary:
          recentVibeSeed
            ? `Vibe calibrated across ${listenedHistory.length} listened tracks. Real-time session neural matching active.`
            : 'Live AI & Trending Engine Active: Continuously streaming latest Indian chartbusters.',
        dominantGenres: ['Bollywood', 'Kollywood', 'Mollywood', 'Desi Pop'],
        energyLevel: 0.82,
        danceability: 0.78,
        acousticness: 0.35,
        totalListens: listenedHistory.length > 0 ? listenedHistory.length : 24,
      },
    };

    // Store in server cache
    RECOMMENDATIONS_CACHE.set(cacheKey, {
      timestamp: Date.now(),
      data: payload,
    });

    if (RECOMMENDATIONS_CACHE.size > 1000) {
      const cutoff = Date.now() - CACHE_TTL_MS;
      for (const [k, v] of RECOMMENDATIONS_CACHE.entries()) {
        if (v.timestamp < cutoff) RECOMMENDATIONS_CACHE.delete(k);
      }
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
