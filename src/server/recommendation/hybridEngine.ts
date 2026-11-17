import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { HYBRID_WEIGHTS, DIVERSITY_RULES, DECAY_PARAMS } from './config';
import { contentBasedRecommender } from './contentBased';
import { collaborativeRecommender } from './collaborative';
import { cleanSongTitle, cleanNorm } from '@/lib/youtube/songFilter';

export interface HybridScoringOptions {
  userId?: string;
  sessionId?: string;
  seedTrack?: Track;
  limit?: number;
  excludeHistory?: boolean;
}

export class HybridRecommendationEngine {
  /**
   * Generates ranked, personalized recommendations combining Content-Based,
   * Collaborative Filtering, User Preferences, and Trending/Freshness.
   */
  public async getHybridRecommendations(options: HybridScoringOptions = {}): Promise<Track[]> {
    const { userId, sessionId, seedTrack, limit = 20, excludeHistory = true } = options;

    // 1. Fetch User Preferences and Listening History
    const [userPref, userHistory, candidateTracks] = await Promise.all([
      userId ? prisma.userPreference.findUnique({ where: { userId } }) : null,
      this.getUserHistoryTracks(userId, sessionId),
      prisma.track.findMany({
        take: DIVERSITY_RULES.candidatePoolSize,
        orderBy: [{ popularity: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const dislikedTrackIds = new Set(userPref?.dislikedTrackIds || []);
    const dislikedArtists = new Set((userPref?.dislikedArtistNames || []).map((a) => cleanNorm(a)));

    const historyTrackIds = new Set(userHistory.map((h) => h.id));
    const historyYoutubeIds = new Set(userHistory.map((h) => h.youtubeId));

    // Get recently skipped track IDs
    const skippedTrackIds = await this.getRecentlySkippedTrackIds(userId, sessionId);

    // 2. Fetch Collaborative Filtering Scores
    const collabScores = await collaborativeRecommender.getCollaborativeScores(
      userId,
      sessionId,
      userHistory.map((h) => h.id)
    );

    // 3. User taste vector & preference arrays
    let userCentroid: number[] | undefined;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { tasteVector: true } });
      if (u?.tasteVector && u.tasteVector.length === 8) {
        userCentroid = u.tasteVector;
      }
    }

    const preferredLanguages = userPref?.preferredLanguages || [];
    const preferredGenres = userPref?.preferredGenres || [];
    const preferredArtists = (userPref?.topArtists || []).map((a) => cleanNorm(a));

    const scoredCandidates: { track: any; score: number; matchReason: string }[] = [];

    // 4. Score each candidate
    for (const cand of candidateTracks) {
      const candKey = cand.youtubeId || cand.id;
      const normArtist = cleanNorm(cand.artist);

      // Strict Exclusion Filters
      if (dislikedTrackIds.has(cand.id) || dislikedTrackIds.has(cand.youtubeId)) continue;
      if (dislikedArtists.has(normArtist)) continue;
      if (excludeHistory && (historyTrackIds.has(cand.id) || historyYoutubeIds.has(candKey))) continue;
      if (seedTrack && (seedTrack.id === cand.id || seedTrack.youtubeId === cand.youtubeId)) continue;

      // Component A: Content-Based Similarity (40%)
      const contentScore = contentBasedRecommender.computeSimilarity(cand, {
        preferredLanguages,
        preferredGenres,
        seedTrack,
        userCentroid,
      });

      // Component B: Collaborative Filtering (30%)
      const collabScore = collabScores.get(cand.id) || 0;

      // Component C: User Preference Alignment (20%)
      let userPrefScore = 0.5; // neutral baseline
      if (preferredArtists.includes(normArtist)) {
        userPrefScore += 0.3;
      }
      if (cand.language && preferredLanguages.map((l) => l.toLowerCase()).includes(cand.language.toLowerCase())) {
        userPrefScore += 0.2;
      }
      if (cand.genre && preferredGenres.map((g) => g.toLowerCase()).includes(cand.genre.toLowerCase())) {
        userPrefScore += 0.2;
      }
      userPrefScore = Math.min(1.0, userPrefScore);

      // Component D: Trending & Freshness (10%)
      let trendingFreshnessScore = (cand.popularity || 50) / 100;
      if (cand.releaseDate) {
        const daysOld = Math.max(0, (Date.now() - new Date(cand.releaseDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld <= 90) {
          trendingFreshnessScore += 0.25; // Freshness boost
        }
      }
      trendingFreshnessScore = Math.min(1.0, trendingFreshnessScore);

      // Hybrid Weighted Formula
      let hybridScore =
        HYBRID_WEIGHTS.contentBased * contentScore +
        HYBRID_WEIGHTS.collaborative * collabScore +
        HYBRID_WEIGHTS.userPreference * userPrefScore +
        HYBRID_WEIGHTS.trendingFreshness * trendingFreshnessScore;

      // Penalty Adjustments
      if (skippedTrackIds.has(cand.id)) {
        hybridScore -= 0.4; // Heavily penalize recently skipped tracks
      }

      // Determine match reason for transparency
      let matchReason = 'Recommended for your vibe';
      if (collabScore > 0.6) {
        matchReason = 'Listeners with similar taste love this';
      } else if (seedTrack && cand.genre === seedTrack.genre) {
        matchReason = `Similar to ${seedTrack.title}`;
      } else if (preferredArtists.includes(normArtist)) {
        matchReason = `Because you like ${cand.artist}`;
      }

      scoredCandidates.push({
        track: cand,
        score: parseFloat(hybridScore.toFixed(4)),
        matchReason,
      });
    }

    // 5. Sort by descending hybrid score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 6. Apply Artist Diversity Filter: max N tracks per primary artist
    const finalTracks: Track[] = [];
    const artistCounts = new Map<string, number>();

    for (const item of scoredCandidates) {
      const primaryArtist = cleanNorm(item.track.artist.split(',')[0].trim());
      const currentCount = artistCounts.get(primaryArtist) || 0;

      if (currentCount >= DIVERSITY_RULES.maxSongsPerArtistPerRail) {
        continue;
      }

      artistCounts.set(primaryArtist, currentCount + 1);

      const aiMatch = Math.round(Math.min(99, Math.max(82, (item.score * 0.4 + 0.6) * 100)));

      finalTracks.push({
        id: item.track.id,
        youtubeId: item.track.youtubeId,
        title: item.track.title,
        artist: item.track.artist,
        album: item.track.album || undefined,
        duration: item.track.duration,
        thumbnail: item.track.thumbnail,
        language: item.track.language || undefined,
        genre: item.track.genre || undefined,
        tags: item.track.tags || [],
        releaseDate: item.track.releaseDate || undefined,
        popularity: item.track.popularity,
        source: 'catalog',
        aiMatch,
        recommendationScore: item.score,
        matchReason: item.matchReason,
      });

      if (finalTracks.length >= limit) break;
    }

    return finalTracks;
  }

  private async getUserHistoryTracks(userId?: string, sessionId?: string): Promise<any[]> {
    if (!userId && !sessionId) return [];
    try {
      const conditions: any[] = [];
      if (userId) conditions.push({ userId });
      if (sessionId) conditions.push({ sessionId });

      const events = await prisma.listeningEvent.findMany({
        where: { OR: conditions },
        include: { track: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const seen = new Set<string>();
      const tracks: any[] = [];
      for (const ev of events) {
        if (!ev.track) continue;
        if (!seen.has(ev.track.id)) {
          seen.add(ev.track.id);
          tracks.push(ev.track);
        }
      }
      return tracks;
    } catch {
      return [];
    }
  }

  private async getRecentlySkippedTrackIds(userId?: string, sessionId?: string): Promise<Set<string>> {
    const skipped = new Set<string>();
    if (!userId && !sessionId) return skipped;

    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const conditions: any[] = [];
      if (userId) conditions.push({ userId });
      if (sessionId) conditions.push({ sessionId });

      const events = await prisma.listeningEvent.findMany({
        where: {
          OR: conditions,
          eventType: 'track_skip',
          createdAt: { gte: threeDaysAgo },
        },
        select: { trackId: true },
        take: 30,
      });

      events.forEach((e) => skipped.add(e.trackId));
    } catch {
      // Non-critical
    }

    return skipped;
  }
}

export const hybridEngine = new HybridRecommendationEngine();

