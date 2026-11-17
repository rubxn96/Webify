import prisma from '@/lib/db/prisma';
import { Track, DiscoveryRecommendationsResponse, ArtistDiscovery } from '@/types';
import { hybridEngine } from './hybridEngine';
import { trendingRecommender } from './trending';
import { metadataIngestionService } from '../metadata/metadataIngestion.service';
import { IndianLanguage, SUPPORTED_INDIAN_LANGUAGES } from '../metadata/types';
import { cleanNorm } from '@/lib/youtube/songFilter';

export class DiscoverEngine {
  /**
   * Generates all 10 discover sections with hybrid scoring, language personalization,
   * artist discovery, and multi-tier caching.
   */
  public async getFullDiscoveryFeed(options: {
    userId?: string;
    sessionId?: string;
  }): Promise<DiscoveryRecommendationsResponse> {
    const { userId, sessionId } = options;
    const cacheKey = userId ? `discover_user_${userId}` : sessionId ? `discover_sess_${sessionId}` : 'discover_guest';

    // 0. Check database / memory cache (TTL: 10 minutes)
    try {
      const cached = await prisma.recommendationCache.findUnique({
        where: { cacheKey },
      });
      if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
        return cached.data as unknown as DiscoveryRecommendationsResponse;
      }
    } catch {
      // Continue to fresh calculation
    }

    // Ensure baseline Indian catalog is present
    await metadataIngestionService.ensureBaselineCatalog();

    // 1. Fetch user recent history to find seeds
    const userHistory = await this.getUserHistory(userId, sessionId, 20);
    const mostRecentSeed = userHistory[0] || null;

    // Fetch user preferences
    const userPref = userId ? await prisma.userPreference.findUnique({ where: { userId } }) : null;
    const userPreferredLanguages = (userPref?.preferredLanguages?.length
      ? userPref.preferredLanguages
      : ['hindi', 'malayalam', 'tamil', 'punjabi']) as IndianLanguage[];

    // 2. Run hybrid recommendation queries in parallel
    const [
      madeForYou,
      recommendedForYou,
      trendingIndia,
      recentlyReleased,
      hiddenGems,
    ] = await Promise.all([
      hybridEngine.getHybridRecommendations({ userId, sessionId, limit: 16 }),
      hybridEngine.getHybridRecommendations({ userId, sessionId, seedTrack: mostRecentSeed, limit: 16 }),
      trendingRecommender.getTrendingIndianSongs(16),
      trendingRecommender.getNewlyReleasedSongs(16),
      trendingRecommender.getHiddenGems(12),
    ]);

    // 3. Section 3: "Because You Listened To..."
    let becauseYouListenedTo: { seed: Track; tracks: Track[] } | null = null;
    if (mostRecentSeed) {
      const seedRecs = await hybridEngine.getHybridRecommendations({
        userId,
        sessionId,
        seedTrack: mostRecentSeed,
        limit: 12,
      });
      if (seedRecs.length > 0) {
        becauseYouListenedTo = {
          seed: mostRecentSeed,
          tracks: seedRecs,
        };
      }
    }

    // 4. Section 4: "Similar Songs"
    const similarSongs = recommendedForYou.slice(0, 12);

    // 5. Section 5: "Discover New Artists"
    const discoverNewArtists = await this.generateArtistDiscovery(userHistory, madeForYou);

    // 6. Section 7: "Trending in Your Languages"
    const trendingInYourLanguages: Record<string, Track[]> = {};
    for (const lang of userPreferredLanguages.slice(0, 4)) {
      const langTracks = await trendingRecommender.getTrendingByLanguage(lang as IndianLanguage, 12);
      if (langTracks.length > 0) {
        trendingInYourLanguages[lang] = langTracks;
      }
    }

    // 7. Section 10: "Your Daily Mix"
    const dailyMix = await this.generateDailyMix(userHistory, madeForYou, trendingIndia);

    // Complementary rails for existing home page
    const hero = madeForYou[0] || trendingIndia[0] || null;
    const quickAccess = [...madeForYou.slice(0, 3), ...trendingIndia.slice(0, 3)].slice(0, 6);

    const payload: DiscoveryRecommendationsResponse = {
      // 10 Distinct Recommendation Sections
      madeForYou,
      recommendedForYou,
      becauseYouListenedTo,
      similarSongs,
      discoverNewArtists,
      trendingIndia,
      trendingInYourLanguages,
      recentlyReleased,
      hiddenGems,
      dailyMix,

      // Compatibility Bridges
      hero,
      quickAccess,
      vibeRecommendations: madeForYou,
      recentVibeSeed: mostRecentSeed
        ? {
            title: mostRecentSeed.title,
            artist: mostRecentSeed.artist,
            summary: `Calibrated to your recent vibe "${mostRecentSeed.title}"`,
          }
        : null,
      recentlyPlayed: userHistory,
      trendingSouth: trendingInYourLanguages['malayalam'] || trendingInYourLanguages['tamil'] || [],
      latestHindi: trendingInYourLanguages['hindi'] || [],
      punjabiDesiHipHop: trendingInYourLanguages['punjabi'] || [],
      acousticSoul: hiddenGems,
    };

    // Store in RecommendationCache with 10 min TTL
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.recommendationCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          section: 'full_discovery',
          data: payload as any,
          expiresAt,
        },
        update: {
          data: payload as any,
          expiresAt,
        },
      });
    } catch {
      // Non-critical cache error
    }

    return payload;
  }

  private async generateArtistDiscovery(userHistory: Track[], candidates: Track[]): Promise<ArtistDiscovery[]> {
    const knownArtists = new Set(userHistory.map((h) => cleanNorm(h.artist.split(',')[0].trim())));
    const artistGroups = new Map<string, { tracks: Track[]; genres: string[]; language?: string; thumbnail?: string }>();

    for (const t of candidates) {
      const primary = t.artist.split(',')[0].trim();
      const norm = cleanNorm(primary);
      if (knownArtists.has(norm)) continue; // Only new artists

      const current = artistGroups.get(primary) || {
        tracks: [],
        genres: t.genre ? [t.genre] : [],
        language: t.language,
        thumbnail: t.thumbnail,
      };

      current.tracks.push(t);
      artistGroups.set(primary, current);
    }

    const result: ArtistDiscovery[] = [];
    for (const [artist, group] of artistGroups.entries()) {
      if (group.tracks.length >= 2) {
        result.push({
          artist,
          image: group.thumbnail,
          genres: group.genres,
          language: group.language,
          tracks: group.tracks.slice(0, 4),
        });
      }
      if (result.length >= 6) break;
    }

    return result;
  }

  private async generateDailyMix(userHistory: Track[], madeForYou: Track[], trending: Track[]): Promise<Track[]> {
    const mix: Track[] = [];
    const seen = new Set<string>();

    // 40% user favorites & recent, 40% personalized made for you, 20% fresh trending
    const historySample = userHistory.slice(0, 6);
    const recSample = madeForYou.slice(0, 8);
    const trendSample = trending.slice(0, 6);

    const maxLen = Math.max(historySample.length, recSample.length, trendSample.length);
    for (let i = 0; i < maxLen; i++) {
      if (recSample[i] && !seen.has(recSample[i].id)) {
        seen.add(recSample[i].id);
        mix.push(recSample[i]);
      }
      if (historySample[i] && !seen.has(historySample[i].id)) {
        seen.add(historySample[i].id);
        mix.push(historySample[i]);
      }
      if (trendSample[i] && !seen.has(trendSample[i].id)) {
        seen.add(trendSample[i].id);
        mix.push(trendSample[i]);
      }
      if (mix.length >= 20) break;
    }

    return mix;
  }

  private async getUserHistory(userId?: string, sessionId?: string, limit: number = 20): Promise<Track[]> {
    if (!userId && !sessionId) return [];
    try {
      const conditions: any[] = [];
      if (userId) conditions.push({ userId });
      if (sessionId) conditions.push({ sessionId });

      const events = await prisma.listeningEvent.findMany({
        where: { OR: conditions },
        include: { track: true },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      });

      const seen = new Set<string>();
      const tracks: Track[] = [];

      for (const ev of events) {
        if (!ev.track) continue;
        if (!seen.has(ev.track.id)) {
          seen.add(ev.track.id);
          tracks.push({
            id: ev.track.id,
            youtubeId: ev.track.youtubeId,
            title: ev.track.title,
            artist: ev.track.artist,
            album: ev.track.album || undefined,
            duration: ev.track.duration,
            thumbnail: ev.track.thumbnail,
            language: ev.track.language || undefined,
            genre: ev.track.genre || undefined,
            source: 'catalog',
          });
        }
        if (tracks.length >= limit) break;
      }

      return tracks;
    } catch {
      return [];
    }
  }
}

export const discoverEngine = new DiscoverEngine();

