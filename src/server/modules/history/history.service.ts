import prisma from '@/lib/db/prisma';
import { updateAndPersistTasteProfile } from '@/server/recommendation/tasteProfile';
import { Track } from '@/types';

const EVENT_WEIGHTS: Record<string, number> = {
  track_start: 0.05,
  track_progress: 0.1,
  track_skip: -0.8,
  track_complete: 1.2,
};

export class HistoryService {
  public async recordInteraction(data: {
    userId?: string;
    sessionId?: string;
    trackId: string;
    youtubeId?: string;
    title?: string;
    artist?: string;
    thumbnail?: string;
    event: 'track_start' | 'track_progress' | 'track_skip' | 'track_complete';
    progressSeconds: number;
    durationSeconds: number;
  }) {
    const weight = EVENT_WEIGHTS[data.event] ?? 0;

    try {
      const ytId = data.youtubeId || (data.trackId.startsWith('yt-') ? data.trackId.slice(3) : data.trackId);
      const title = data.title && data.title !== 'Unknown Track' ? data.title : undefined;
      const artist = data.artist && data.artist !== 'Unknown Artist' ? data.artist : undefined;
      const thumbnail = data.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

      // Verify track exists; if not, check by id or youtubeId
      let track = await prisma.track.findFirst({
        where: {
          OR: [
            { id: data.trackId },
            { youtubeId: ytId },
            { youtubeId: data.trackId },
          ],
        },
      });

      if (!track) {
        track = await prisma.track.create({
          data: {
            youtubeId: ytId,
            title: title || 'Unknown Track',
            artist: artist || 'Unknown Artist',
            duration: Math.round(data.durationSeconds || 180),
            thumbnail,
            embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
          },
        });
      } else if (
        (title && (track.title === 'Unknown Track' || track.title.length < title.length)) ||
        (artist && track.artist === 'Unknown Artist')
      ) {
        // Upgrade placeholder title/artist to actual song metadata
        track = await prisma.track.update({
          where: { id: track.id },
          data: {
            title: title || track.title,
            artist: artist || track.artist,
            thumbnail: thumbnail || track.thumbnail,
          },
        });
      }

      const telemetry = await prisma.telemetry.create({
        data: {
          userId: data.userId || null,
          sessionId: data.sessionId || null,
          trackId: track.id,
          event: data.event,
          progressSeconds: data.progressSeconds,
          durationSeconds: data.durationSeconds,
          weight,
        },
      });

      // Asynchronously calibrate and update taste profile centroid
      if (data.userId) {
        updateAndPersistTasteProfile(data.userId).catch((err) => {
          console.warn('[HistoryService] Background taste profile update error:', err);
        });
      }

      return telemetry;
    } catch (err) {
      console.warn('[HistoryService] Record interaction notice:', err);
      return {
        id: `mock-${Date.now()}`,
        trackId: data.trackId,
        event: data.event,
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        weight,
      };
    }
  }

  public async getUserOrSessionHistory(options: {
    userId?: string;
    sessionId?: string;
    limit?: number;
  }): Promise<Track[]> {
    const { userId, sessionId, limit = 20 } = options;
    if (!userId && !sessionId) return [];

    try {
      const orClauses = [];
      if (userId) orClauses.push({ userId });
      if (sessionId) orClauses.push({ sessionId });

      const telemetries = await prisma.telemetry.findMany({
        where: {
          OR: orClauses,
        },
        include: { track: true },
        orderBy: { createdAt: 'desc' },
        take: limit * 5, // fetch extra to deduplicate
      });

      const seen = new Set<string>();
      const result: Track[] = [];

      for (const t of telemetries) {
        if (!t.track) continue;
        const key = t.track.youtubeId || t.track.id;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          id: `yt-${t.track.youtubeId}`,
          youtubeId: t.track.youtubeId,
          title: t.track.title,
          artist: t.track.artist,
          album: t.track.album || undefined,
          duration: t.track.duration,
          thumbnail: t.track.thumbnail,
          source: 'youtube',
        });

        if (result.length >= limit) break;
      }

      return result;
    } catch (err) {
      console.error('[HistoryService] getUserOrSessionHistory error:', err);
      return [];
    }
  }

  public async getUserHistory(userId: string, limit: number = 20) {
    try {
      const history = await prisma.telemetry.findMany({
        where: { userId },
        include: { track: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return history.map((h) => ({
        id: h.id,
        event: h.event,
        progressSeconds: h.progressSeconds,
        durationSeconds: h.durationSeconds,
        createdAt: h.createdAt,
        track: {
          id: h.track.id,
          youtubeId: h.track.youtubeId,
          title: h.track.title,
          artist: h.track.artist,
          album: h.track.album || undefined,
          duration: h.track.duration,
          thumbnail: h.track.thumbnail,
        },
      }));
    } catch {
      return [];
    }
  }
}

export const historyService = new HistoryService();
