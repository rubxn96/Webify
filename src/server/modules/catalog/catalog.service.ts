import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { youtubeProvider } from '@/server/providers/youtube.adapter';
import { cleanSongTitle, normalizeKey } from '@/lib/youtube/search';

export class CatalogService {
  /**
   * Searches local PostgreSQL catalog and YouTube provider
   */
  public async search(query: string, limit: number = 25, sourceFilter: 'all' | 'catalog' | 'youtube' = 'all'): Promise<Track[]> {
    if (!query || !query.trim()) return [];
    const cleanQ = query.trim();

    const results: Track[] = [];
    const seenIds = new Set<string>();
    const seenSongKeys = new Set<string>();

    // 1. Search PostgreSQL Catalog (with resilient offline bypass)
    if (sourceFilter !== 'youtube') {
      try {
        const localTracks = await prisma.track.findMany({
          where: {
            OR: [
              { title: { contains: cleanQ, mode: 'insensitive' } },
              { artist: { contains: cleanQ, mode: 'insensitive' } },
              { album: { contains: cleanQ, mode: 'insensitive' } },
              { isrc: { contains: cleanQ, mode: 'insensitive' } },
            ],
          },
          take: limit,
        });

        for (const t of localTracks) {
          const key = `${normalizeKey(t.artist)}:::${normalizeKey(cleanSongTitle(t.title))}`;
          seenIds.add(t.youtubeId);
          seenSongKeys.add(key);

          results.push({
            id: t.id,
            youtubeId: t.youtubeId,
            title: t.title,
            artist: t.artist,
            album: t.album || undefined,
            isrc: t.isrc || undefined,
            duration: t.duration,
            thumbnail: t.thumbnail,
            embedding: Array.isArray(t.embedding) ? t.embedding : undefined,
            lyrics: t.lyrics || undefined,
            source: 'catalog',
          });
        }
      } catch (err: any) {
        console.warn('[CatalogService] Database offline or connecting; falling back to YouTube provider');
      }
    }

    // 2. Search Live YouTube Provider
    if (sourceFilter !== 'catalog' && results.length < limit) {
      const ytResults = await youtubeProvider.search(cleanQ, limit);
      for (const yt of ytResults) {
        const key = `${normalizeKey(yt.artist)}:::${normalizeKey(cleanSongTitle(yt.title))}`;
        if (!seenIds.has(yt.youtubeId) && !seenSongKeys.has(key)) {
          seenIds.add(yt.youtubeId);
          seenSongKeys.add(key);
          results.push(yt);
        }
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Upserts track metadata into local PostgreSQL catalog
   */
  public async syncTrack(data: {
    youtubeId: string;
    title: string;
    artist: string;
    duration?: number;
    thumbnail?: string;
    album?: string;
    lyrics?: string;
    isrc?: string;
    embedding?: number[];
  }): Promise<Track> {
    try {
      const existing = await prisma.track.findUnique({
        where: { youtubeId: data.youtubeId },
      });

      if (existing) {
        return {
          id: existing.id,
          youtubeId: existing.youtubeId,
          title: existing.title,
          artist: existing.artist,
          album: existing.album || undefined,
          isrc: existing.isrc || undefined,
          duration: existing.duration,
          thumbnail: existing.thumbnail,
          embedding: Array.isArray(existing.embedding) ? existing.embedding : undefined,
          lyrics: existing.lyrics || undefined,
          source: 'catalog',
        };
      }

      const defaultEmbedding = data.embedding || [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];

      const created = await prisma.track.create({
        data: {
          youtubeId: data.youtubeId,
          title: data.title,
          artist: data.artist,
          duration: data.duration || 180,
          thumbnail: data.thumbnail || `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`,
          album: data.album,
          lyrics: data.lyrics,
          isrc: data.isrc,
          embedding: defaultEmbedding,
        },
      });

      return {
        id: created.id,
        youtubeId: created.youtubeId,
        title: created.title,
        artist: created.artist,
        album: created.album || undefined,
        isrc: created.isrc || undefined,
        duration: created.duration,
        thumbnail: created.thumbnail,
        embedding: defaultEmbedding,
        lyrics: created.lyrics || undefined,
        source: 'catalog',
      };
    } catch {
      return {
        id: `yt-${data.youtubeId}`,
        youtubeId: data.youtubeId,
        title: data.title,
        artist: data.artist,
        duration: data.duration || 180,
        thumbnail: data.thumbnail || `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`,
        source: 'youtube',
      };
    }
  }

  /**
   * Like / unlike track with auto-sync
   */
  public async toggleLike(
    userId: string,
    trackIdOrYoutubeId: string,
    isLiked: boolean,
    trackData?: any
  ): Promise<boolean> {
    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id: trackIdOrYoutubeId }, { youtubeId: trackIdOrYoutubeId }],
      },
    });

    if (!track && trackData) {
      track = await prisma.track.create({
        data: {
          youtubeId: trackData.youtubeId || trackIdOrYoutubeId,
          title: trackData.title || 'Unknown Track',
          artist: trackData.artist || 'Unknown Artist',
          duration: trackData.duration || 180,
          thumbnail: trackData.thumbnail || '',
          embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
        },
      });
    }

    if (!track) {
      throw new Error('Track not found to like');
    }

    if (isLiked) {
      await prisma.userLike.upsert({
        where: {
          userId_trackId: {
            userId,
            trackId: track.id,
          },
        },
        update: {},
        create: {
          userId,
          trackId: track.id,
        },
      });
    } else {
      await prisma.userLike.deleteMany({
        where: {
          userId,
          trackId: track.id,
        },
      });
    }

    return isLiked;
  }

  public async getLikedTrackIds(userId: string): Promise<string[]> {
    const likes = await prisma.userLike.findMany({
      where: { userId },
      include: { track: true },
    });

    const ids: string[] = [];
    for (const l of likes) {
      ids.push(l.trackId);
      if (l.track?.youtubeId) {
        ids.push(l.track.youtubeId);
      }
    }
    return ids;
  }

  public async getLikedTracks(userId: string): Promise<Track[]> {
    const likes = await prisma.userLike.findMany({
      where: { userId },
      include: { track: true },
      orderBy: { createdAt: 'desc' },
    });

    return likes.map((l) => ({
      id: l.track.id,
      youtubeId: l.track.youtubeId,
      title: l.track.title,
      artist: l.track.artist,
      album: l.track.album || undefined,
      duration: l.track.duration,
      thumbnail: l.track.thumbnail,
      lyrics: l.track.lyrics || undefined,
      isLiked: true,
      source: 'catalog',
    }));
  }
}

export const catalogService = new CatalogService();

