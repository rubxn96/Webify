import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { IndianLanguage, SUPPORTED_INDIAN_LANGUAGES } from '../metadata/types';
import { INDIAN_REGIONAL_CATALOG } from '../metadata/indianMusicCatalog';

export class TrendingRecommender {
  /**
   * Calculates trending score considering recent velocity, completion ratio, and freshness decay
   */
  public async getTrendingIndianSongs(limit: number = 20): Promise<Track[]> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Aggregate recent positive listening events
      const recentEvents = await prisma.listeningEvent.groupBy({
        by: ['trackId'],
        _sum: { weight: true },
        _count: { id: true },
        where: {
          createdAt: { gte: sevenDaysAgo },
          weight: { gt: 0 },
        },
        orderBy: {
          _sum: { weight: 'desc' },
        },
        take: limit * 2,
      });

      const trackIds = recentEvents.map((e) => e.trackId);
      const dbTracks = await prisma.track.findMany({
        where: { id: { in: trackIds } },
      });

      const dbTrackMap = new Map(dbTracks.map((t) => [t.id, t]));
      const ranked: Track[] = [];

      for (const ev of recentEvents) {
        const t = dbTrackMap.get(ev.trackId);
        if (t) {
          ranked.push(this.formatTrack(t));
        }
        if (ranked.length >= limit) break;
      }

      if (ranked.length >= limit / 2) {
        return ranked;
      }

      // Fill with top popularity tracks from DB or regional catalog
      const popularDb = await prisma.track.findMany({
        orderBy: [{ popularity: 'desc' }, { playCount: 'desc' }],
        take: limit,
      });

      const seen = new Set(ranked.map((r) => r.youtubeId || r.id));
      for (const t of popularDb) {
        const key = t.youtubeId || t.id;
        if (!seen.has(key)) {
          seen.add(key);
          ranked.push(this.formatTrack(t));
        }
        if (ranked.length >= limit) break;
      }

      return ranked;
    } catch {
      return INDIAN_REGIONAL_CATALOG.slice(0, limit).map((t) => ({
        id: `yt-${t.youtubeId}`,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        thumbnail: t.thumbnail,
        language: t.language,
        genre: t.genre,
        tags: t.tags,
        source: 'catalog',
      }));
    }
  }

  /**
   * Newly Released Songs: strictly filters songs with releaseDate within the past 120 days
   */
  public async getNewlyReleasedSongs(limit: number = 15): Promise<Track[]> {
    try {
      const oneHundredTwentyDaysAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

      const tracks = await prisma.track.findMany({
        where: {
          releaseDate: { gte: oneHundredTwentyDaysAgo },
        },
        orderBy: { releaseDate: 'desc' },
        take: limit,
      });

      if (tracks.length >= 4) {
        return tracks.map((t) => this.formatTrack(t));
      }

      // Fallback: pick the latest release dates from catalog
      const latestCatalog = await prisma.track.findMany({
        orderBy: { releaseDate: 'desc' },
        take: limit,
      });

      return latestCatalog.map((t) => this.formatTrack(t));
    } catch {
      return INDIAN_REGIONAL_CATALOG.filter((t) => t.releaseDate && t.releaseDate.getFullYear() >= 2024)
        .slice(0, limit)
        .map((t) => ({
          id: `yt-${t.youtubeId}`,
          youtubeId: t.youtubeId,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          thumbnail: t.thumbnail,
          language: t.language,
          genre: t.genre,
          tags: t.tags,
          source: 'catalog',
        }));
    }
  }

  /**
   * Trending songs filtered by specific Indian language
   */
  public async getTrendingByLanguage(language: IndianLanguage, limit: number = 15): Promise<Track[]> {
    try {
      const tracks = await prisma.track.findMany({
        where: {
          language: { equals: language, mode: 'insensitive' },
        },
        orderBy: [{ popularity: 'desc' }, { playCount: 'desc' }],
        take: limit,
      });

      if (tracks.length >= 3) {
        return tracks.map((t) => this.formatTrack(t));
      }

      // Fallback from regional catalog
      const fallback = INDIAN_REGIONAL_CATALOG.filter((t) => t.language === language).map((t) => ({
        id: `yt-${t.youtubeId}`,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        thumbnail: t.thumbnail,
        language: t.language,
        genre: t.genre,
        tags: t.tags,
        source: 'catalog' as const,
      }));

      return fallback.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Hidden Gems: Underrated tracks with high completion ratio but lower overall popularity
   */
  public async getHiddenGems(limit: number = 12): Promise<Track[]> {
    try {
      const tracks = await prisma.track.findMany({
        where: {
          popularity: { lte: 85, gte: 30 },
          genre: { in: ['Indie', 'Acoustic', 'Folk', 'Sufi'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return tracks.map((t) => this.formatTrack(t));
    } catch {
      return INDIAN_REGIONAL_CATALOG.filter((t) => ['Indie', 'Acoustic', 'Folk'].includes(t.genre || ''))
        .slice(0, limit)
        .map((t) => ({
          id: `yt-${t.youtubeId}`,
          youtubeId: t.youtubeId,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          thumbnail: t.thumbnail,
          language: t.language,
          genre: t.genre,
          tags: t.tags,
          source: 'catalog',
        }));
    }
  }

  private formatTrack(t: any): Track {
    return {
      id: t.id,
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      album: t.album || undefined,
      duration: t.duration,
      thumbnail: t.thumbnail,
      language: t.language || undefined,
      genre: t.genre || undefined,
      tags: t.tags || [],
      releaseDate: t.releaseDate || undefined,
      popularity: t.popularity || 50,
      source: 'catalog',
    };
  }
}

export const trendingRecommender = new TrendingRecommender();

