import prisma from '@/lib/db/prisma';
import { updateAndPersistTasteProfile } from '@/server/recommendation/tasteProfile';

const EVENT_WEIGHTS: Record<string, number> = {
  track_start: 0.05,
  track_progress: 0.1,
  track_skip: -0.8,
  track_complete: 1.2,
};

export class HistoryService {
  public async recordInteraction(data: {
    userId?: string;
    trackId: string;
    event: 'track_start' | 'track_progress' | 'track_skip' | 'track_complete';
    progressSeconds: number;
    durationSeconds: number;
  }) {
    const weight = EVENT_WEIGHTS[data.event] ?? 0;

    // Verify track exists; if not, check by youtubeId
    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id: data.trackId }, { youtubeId: data.trackId }],
      },
    });

    if (!track) {
      track = await prisma.track.create({
        data: {
          youtubeId: data.trackId,
          title: 'Unknown Track',
          artist: 'Unknown Artist',
          duration: Math.round(data.durationSeconds || 180),
          thumbnail: `https://img.youtube.com/vi/${data.trackId}/hqdefault.jpg`,
          embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
        },
      });
    }

    const telemetry = await prisma.telemetry.create({
      data: {
        userId: data.userId,
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
  }

  public async getUserHistory(userId: string, limit: number = 20) {
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
  }
}

export const historyService = new HistoryService();

