import prisma from '@/lib/db/prisma';
import { ListeningEventType } from '@/types';
import { INTERACTION_WEIGHTS, DECAY_PARAMS } from '@/server/recommendation/config';
import { cleanSongTitle } from '@/lib/youtube/songFilter';

export interface RecordEventInput {
  userId?: string;
  sessionId?: string;
  trackId: string;
  youtubeId?: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  eventType: ListeningEventType;
  progressSeconds?: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export class TrackingService {
  /**
   * Ingests a user listening interaction, applies weighting & deduplication,
   * updates taste vectors and user preferences, and invalidates stale caches.
   */
  public async recordEvent(input: RecordEventInput) {
    const {
      userId,
      sessionId,
      trackId,
      youtubeId,
      title,
      artist,
      thumbnail,
      eventType,
      progressSeconds = 0,
      durationSeconds = 180,
      metadata,
    } = input;

    // 1. Resolve or create Track record
    const track = await this.ensureTrackExists({
      trackId,
      youtubeId,
      title,
      artist,
      thumbnail,
      durationSeconds,
    });

    if (!track) return null;

    // 2. Determine calibrated interaction weight
    let weight = this.calculateInteractionWeight(eventType, progressSeconds, durationSeconds);

    // 3. Deduplication and frequency dampening
    const recentCount = await this.getRecentRepeatCount(track.id, userId, sessionId);
    if (recentCount > DECAY_PARAMS.maxHourlyRepeatsBeforeDampening) {
      const dampening = 1 / (1 + Math.log2(recentCount - DECAY_PARAMS.maxHourlyRepeatsBeforeDampening + 1));
      weight = weight * Math.max(0.2, dampening);
    }

    // 4. Save ListeningEvent to PostgreSQL
    const listeningEvent = await prisma.listeningEvent.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
        trackId: track.id,
        eventType,
        progressSeconds,
        durationSeconds,
        weight,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    // 5. Save Telemetry mirror for backward compatibility
    try {
      await prisma.telemetry.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
          trackId: track.id,
          event: eventType.startsWith('track_') ? eventType : 'track_progress',
          progressSeconds,
          durationSeconds,
          weight,
        },
      });
    } catch {
      // Non-critical mirror
    }

    // 6. Handle Dislike event (actively adds to user preference blacklist)
    if (eventType === 'track_dislike' && userId) {
      await this.recordDislike(userId, track.id, track.artist);
    }

    // 7. Update UserPreferences and Taste Vector incrementally
    if (userId) {
      this.updateUserPreferencesAsync(userId, track, weight, eventType).catch((err) => {
        console.warn('[TrackingService] Preference update error:', err);
      });
    }

    // 8. Invalidate Recommendation Cache for this user / session
    this.invalidateRecommendationCache(userId, sessionId).catch(() => {});

    return listeningEvent;
  }

  private calculateInteractionWeight(
    eventType: ListeningEventType,
    progress: number,
    duration: number
  ): number {
    switch (eventType) {
      case 'track_start':
        return INTERACTION_WEIGHTS.track_start; // +1.0

      case 'track_complete':
        return INTERACTION_WEIGHTS.track_complete; // +3.0

      case 'track_80_percent':
        return INTERACTION_WEIGHTS.track_80_percent; // +3.0

      case 'track_like':
        return INTERACTION_WEIGHTS.track_like; // +5.0

      case 'track_dislike':
        return INTERACTION_WEIGHTS.track_dislike; // -5.0

      case 'playlist_add':
        return INTERACTION_WEIGHTS.playlist_add; // +4.0

      case 'playlist_remove':
        return INTERACTION_WEIGHTS.playlist_remove; // -1.0

      case 'track_repeat':
        return INTERACTION_WEIGHTS.track_repeat; // +4.0

      case 'artist_follow':
        return INTERACTION_WEIGHTS.artist_follow; // +3.0

      case 'search_query':
        return INTERACTION_WEIGHTS.search_query; // +0.5

      case 'track_skip': {
        // If skipped within 10 seconds or < 20% duration -> strong negative signal (-3)
        if (progress <= DECAY_PARAMS.earlySkipThresholdSeconds || (duration > 0 && progress / duration < 0.2)) {
          return INTERACTION_WEIGHTS.track_skip_early;
        }
        return INTERACTION_WEIGHTS.track_skip_late;
      }

      case 'track_progress': {
        // If progress is >= 80% duration, grant 80% completion boost
        if (duration > 0 && progress / duration >= DECAY_PARAMS.completionThresholdRatio) {
          return INTERACTION_WEIGHTS.track_80_percent;
        }
        return 0.1;
      }

      default:
        return 1.0;
    }
  }

  private async getRecentRepeatCount(trackId: string, userId?: string, sessionId?: string): Promise<number> {
    if (!userId && !sessionId) return 0;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const conditions: any[] = [];
    if (userId) conditions.push({ userId });
    if (sessionId) conditions.push({ sessionId });

    return prisma.listeningEvent.count({
      where: {
        trackId,
        createdAt: { gte: oneHourAgo },
        OR: conditions,
      },
    });
  }

  private async recordDislike(userId: string, trackId: string, artistName: string) {
    try {
      const pref = await prisma.userPreference.findUnique({ where: { userId } });
      if (pref) {
        const dislikedTrackIds = Array.from(new Set([...pref.dislikedTrackIds, trackId]));
        const dislikedArtistNames = Array.from(new Set([...pref.dislikedArtistNames, artistName]));
        await prisma.userPreference.update({
          where: { userId },
          data: { dislikedTrackIds, dislikedArtistNames },
        });
      } else {
        await prisma.userPreference.create({
          data: {
            userId,
            dislikedTrackIds: [trackId],
            dislikedArtistNames: [artistName],
          },
        });
      }
    } catch (err) {
      console.warn('[TrackingService] Failed to record dislike:', err);
    }
  }

  private async updateUserPreferencesAsync(userId: string, track: any, weight: number, eventType: string) {
    if (weight <= 0) return;

    try {
      const pref = await prisma.userPreference.findUnique({ where: { userId } });
      const currentLanguages = pref?.preferredLanguages || [];
      const currentGenres = pref?.preferredGenres || [];
      const currentArtists = pref?.topArtists || [];

      const newLanguages = track.language ? Array.from(new Set([track.language, ...currentLanguages])).slice(0, 5) : currentLanguages;
      const newGenres = track.genre ? Array.from(new Set([track.genre, ...currentGenres])).slice(0, 8) : currentGenres;
      const newArtists = track.artist ? Array.from(new Set([track.artist.split(',')[0].trim(), ...currentArtists])).slice(0, 10) : currentArtists;

      await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          preferredLanguages: newLanguages,
          preferredGenres: newGenres,
          topArtists: newArtists,
        },
        update: {
          preferredLanguages: newLanguages,
          preferredGenres: newGenres,
          topArtists: newArtists,
        },
      });

      // Update User.tasteVector centroid
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { tasteVector: true } });
      const currentVector = user?.tasteVector?.length === 8 ? user.tasteVector : [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];
      const trackVector = track.embedding?.length === 8 ? track.embedding : [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];

      // Exponential moving average: newCentroid = 0.9 * current + 0.1 * trackVector
      const updatedVector = currentVector.map((v, i) => parseFloat((v * 0.9 + trackVector[i] * 0.1).toFixed(4)));

      await prisma.user.update({
        where: { id: userId },
        data: { tasteVector: updatedVector },
      });
    } catch {
      // Async failure is non-blocking
    }
  }

  private async invalidateRecommendationCache(userId?: string, sessionId?: string) {
    try {
      const keysToDelete: string[] = [];
      if (userId) keysToDelete.push(`user_${userId}`, `rec_for_you_${userId}`, `daily_mix_${userId}`);
      if (sessionId) keysToDelete.push(`sess_${sessionId}`);

      await prisma.recommendationCache.deleteMany({
        where: {
          cacheKey: { in: keysToDelete },
        },
      });
    } catch {
      // Non-critical
    }
  }

  private async ensureTrackExists(data: {
    trackId: string;
    youtubeId?: string;
    title?: string;
    artist?: string;
    thumbnail?: string;
    durationSeconds?: number;
  }) {
    const ytId = data.youtubeId || (data.trackId.startsWith('yt-') ? data.trackId.slice(3) : data.trackId);

    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id: data.trackId }, { youtubeId: ytId }],
      },
    });

    if (!track) {
      track = await prisma.track.create({
        data: {
          youtubeId: ytId,
          title: cleanSongTitle(data.title || 'Unknown Track') || data.title || 'Unknown Track',
          artist: data.artist || 'Unknown Artist',
          duration: Math.round(data.durationSeconds || 180),
          thumbnail: data.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
          source: 'youtube',
        },
      });
    }

    return track;
  }
}

export const trackingService = new TrackingService();

