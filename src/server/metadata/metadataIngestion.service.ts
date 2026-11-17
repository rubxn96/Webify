import prisma from '@/lib/db/prisma';
import { IndianLanguage, RawSongMetadata, SUPPORTED_INDIAN_LANGUAGES } from './types';
import { jioSaavnService } from './jiosaavn.service';
import { lastFmService } from './lastfm.service';
import { musicBrainzService } from './musicbrainz.service';
import { INDIAN_REGIONAL_CATALOG } from './indianMusicCatalog';
import { cleanSongTitle, cleanNorm } from '@/lib/youtube/songFilter';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

export class MetadataIngestionService {
  private isInitialized = false;

  /**
   * Initializes baseline regional Indian music catalog into database
   */
  public async ensureBaselineCatalog(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const existingCount = await prisma.track.count();
      // If we already have tracks, enrich any track missing language/genre
      for (const raw of INDIAN_REGIONAL_CATALOG) {
        await this.upsertSongMetadata(raw);
      }
    } catch (err) {
      console.warn('[MetadataIngestion] Baseline catalog notice:', err);
    }
  }

  /**
   * Upserts a raw song metadata object into PostgreSQL Track table
   */
  public async upsertSongMetadata(meta: RawSongMetadata): Promise<any> {
    const cleanTitle = cleanSongTitle(meta.title) || meta.title;
    const normTitle = cleanNorm(cleanTitle);
    const normArtist = cleanNorm(meta.artist);

    // 1. Check if track already exists by youtubeId, isrc, or jioSaavnId
    let existing = await prisma.track.findFirst({
      where: {
        OR: [
          meta.youtubeId ? { youtubeId: meta.youtubeId } : undefined,
          meta.isrc ? { isrc: meta.isrc } : undefined,
          meta.jioSaavnId ? { jioSaavnId: meta.jioSaavnId } : undefined,
        ].filter(Boolean) as any,
      },
    });

    // 2. If not found by IDs, check by title & artist
    if (!existing) {
      existing = await prisma.track.findFirst({
        where: {
          title: { equals: cleanTitle, mode: 'insensitive' },
          artist: { contains: meta.artist.split(',')[0].trim(), mode: 'insensitive' },
        },
      });
    }

    // Default 8D acoustic embedding if missing
    const embedding =
      meta.embedding && meta.embedding.length === 8
        ? meta.embedding
        : this.generateEstimatedEmbedding(meta);

    // 3. Resolve YouTube ID if missing
    let youtubeId: string | null | undefined = meta.youtubeId || existing?.youtubeId;
    if (!youtubeId) {
      youtubeId = await this.resolveYouTubeId(cleanTitle, meta.artist, meta.duration);
    }

    if (!youtubeId) {
      // Cannot save track without youtubeId since youtubeId is @unique and required for playback
      return null;
    }

    if (existing) {
      // Upgrade existing track with richer metadata
      return prisma.track.update({
        where: { id: existing.id },
        data: {
          language: meta.language || existing.language,
          genre: meta.genre || existing.genre,
          tags: meta.tags && meta.tags.length > 0 ? Array.from(new Set([...existing.tags, ...meta.tags])) : existing.tags,
          releaseDate: meta.releaseDate || existing.releaseDate,
          popularity: meta.popularity || existing.popularity,
          primaryArtists: meta.primaryArtists && meta.primaryArtists.length > 0 ? meta.primaryArtists : existing.primaryArtists,
          featuredArtists: meta.featuredArtists && meta.featuredArtists.length > 0 ? meta.featuredArtists : existing.featuredArtists,
          jioSaavnId: meta.jioSaavnId || existing.jioSaavnId,
          mbid: meta.mbid || existing.mbid,
          isrc: meta.isrc || existing.isrc,
        },
      });
    }

    return prisma.track.create({
      data: {
        youtubeId,
        title: cleanTitle,
        artist: meta.artist,
        album: meta.album,
        isrc: meta.isrc,
        duration: Math.round(meta.duration || 180),
        thumbnail: meta.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        embedding,
        lyrics: meta.lyrics,
        language: meta.language,
        genre: meta.genre,
        tags: meta.tags || [],
        releaseDate: meta.releaseDate,
        popularity: meta.popularity || 50,
        primaryArtists: meta.primaryArtists || [],
        featuredArtists: meta.featuredArtists || [],
        jioSaavnId: meta.jioSaavnId,
        mbid: meta.mbid,
        source: 'catalog',
      },
    });
  }

  /**
   * Discovers and ingests songs for a specific Indian language
   */
  public async ingestLanguageCatalog(language: IndianLanguage, limit: number = 15): Promise<any[]> {
    const rawList = await jioSaavnService.discoverByLanguage(language, limit);
    const savedTracks: any[] = [];

    for (const raw of rawList) {
      try {
        const saved = await this.upsertSongMetadata(raw);
        if (saved) savedTracks.push(saved);
      } catch (err) {
        console.warn(`[MetadataIngestion] Error saving song ${raw.title}:`, err);
      }
    }

    return savedTracks;
  }

  /**
   * Search external providers and ingest into catalog
   */
  public async searchAndIngest(query: string, limit: number = 10): Promise<any[]> {
    const rawList = await jioSaavnService.searchSongs(query, limit);
    const ingested: any[] = [];

    for (const raw of rawList) {
      try {
        const saved = await this.upsertSongMetadata(raw);
        if (saved) ingested.push(saved);
      } catch {
        // Continue
      }
    }

    return ingested;
  }

  /**
   * Resolves YouTube ID with duration and label matching
   */
  private async resolveYouTubeId(title: string, artist: string, targetDuration?: number): Promise<string | null> {
    try {
      const match = await youtubeProvider.matchExternalTrack({
        title,
        artist,
        durationSeconds: targetDuration,
      });

      if (match?.matched && match.track?.youtubeId) {
        return match.track.youtubeId;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Synthesizes 8D acoustic embedding vector based on genre, tags, and language
   * [0: energy, 1: valence, 2: tempo, 3: acousticness, 4: danceability, 5: instrumentalness, 6: speechiness, 7: liveness]
   */
  private generateEstimatedEmbedding(meta: RawSongMetadata): number[] {
    const text = `${meta.genre || ''} ${meta.tags?.join(' ') || ''} ${meta.language || ''}`.toLowerCase();

    let energy = 0.65;
    let valence = 0.6;
    let tempo = 0.55;
    let acousticness = 0.3;
    let danceability = 0.65;
    let instrumentalness = 0.02;
    let speechiness = 0.06;
    let liveness = 0.12;

    if (text.includes('acoustic') || text.includes('unplugged') || text.includes('soulful')) {
      energy = 0.38;
      acousticness = 0.85;
      danceability = 0.42;
      valence = 0.48;
    } else if (text.includes('hip-hop') || text.includes('rap') || text.includes('trap')) {
      energy = 0.88;
      danceability = 0.85;
      acousticness = 0.08;
      speechiness = 0.22;
      tempo = 0.72;
    } else if (text.includes('party') || text.includes('dance') || text.includes('kuthu') || text.includes('mass')) {
      energy = 0.95;
      danceability = 0.9;
      acousticness = 0.04;
      valence = 0.88;
      tempo = 0.8;
    } else if (text.includes('classical') || text.includes('carnatic') || text.includes('sufi')) {
      energy = 0.52;
      acousticness = 0.68;
      danceability = 0.35;
      instrumentalness = 0.15;
    }

    return [energy, valence, tempo, acousticness, danceability, instrumentalness, speechiness, liveness];
  }
}

export const metadataIngestionService = new MetadataIngestionService();

