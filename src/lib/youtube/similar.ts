import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { cleanSongTitle, normalizeKey } from './search';
import { cosineSimilarity } from '../recommender/vectorEngine';
import { youtubeProvider, cleanNorm } from '@/server/providers/youtube.adapter';

/**
 * Generates similar tracks with respect to the currently playing song.
 * Uses RDAMVM YouTube Mix scraping and local 8D vector cosine similarity.
 * Filters out duplicate versions, lyric versions, or re-uploads of the current song!
 */
export async function getSimilarTracks(
  currentTrack: {
    youtubeId: string;
    title: string;
    artist: string;
    embedding?: number[];
  },
  limit: number = 20
): Promise<Track[]> {
  const currentClean = cleanSongTitle(currentTrack.title);
  const currentNormTitle = cleanNorm(currentClean);
  const currentKey = `${cleanNorm(currentTrack.artist)}:::${currentNormTitle}`;

  const similarList: Track[] = [];
  const seenSongKeys = new Set<string>([currentKey]);
  const seenYouTubeIds = new Set<string>([currentTrack.youtubeId]);

  // 1. Check local catalog tracks (Vector similarity & Artist matches)
  try {
    const catalogTracks = await prisma.track.findMany({
      where: {
        youtubeId: { not: currentTrack.youtubeId },
      },
      take: 25,
    });

    const targetEmbedding = currentTrack.embedding || [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];

    const scoredCatalog = catalogTracks
      .map((t) => {
        const emb = Array.isArray(t.embedding) && t.embedding.length > 0
          ? t.embedding
          : (typeof t.embedding === 'string' ? JSON.parse(t.embedding) : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);

        let score = cosineSimilarity(targetEmbedding, emb);
        // Artist affinity bonus
        if (
          t.artist.toLowerCase().includes(currentTrack.artist.toLowerCase()) ||
          currentTrack.artist.toLowerCase().includes(t.artist.toLowerCase())
        ) {
          score += 0.3;
        }
        return { track: t, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const item of scoredCatalog) {
      const t = item.track;
      const tClean = cleanSongTitle(t.title);
      const tNorm = cleanNorm(tClean);
      const songKey = `${cleanNorm(t.artist)}:::${tNorm}`;

      // Strictly skip if it matches current song title
      if (tNorm === currentNormTitle || seenSongKeys.has(songKey)) continue;

      seenSongKeys.add(songKey);
      seenYouTubeIds.add(t.youtubeId);

      similarList.push({
        id: t.id,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album || undefined,
        duration: t.duration,
        thumbnail: t.thumbnail,
        lyrics: t.lyrics || undefined,
        source: 'catalog',
      });

      if (similarList.length >= 4) break;
    }
  } catch {
    // Continue to mix scraper
  }

  // 2. Fetch related songs using YouTubeProviderAdapter's RDAMVM Mix scraper
  try {
    const mixResults = await youtubeProvider.scrapeRelatedMix(currentTrack.youtubeId, limit);

    for (const yt of mixResults) {
      const cleanedTitle = cleanSongTitle(yt.title);
      const songNormTitle = cleanNorm(cleanedTitle);
      const songKey = `${cleanNorm(yt.artist)}:::${songNormTitle}`;

      // CRITICAL: Strictly skip if this song is the SAME as current playing song
      // or if it's already in the list
      if (
        songNormTitle === currentNormTitle ||
        seenSongKeys.has(songKey) ||
        seenYouTubeIds.has(yt.youtubeId)
      ) {
        continue;
      }

      seenSongKeys.add(songKey);
      seenYouTubeIds.add(yt.youtubeId);

      similarList.push({
        ...yt,
        title: cleanedTitle || yt.title,
      });

      if (similarList.length >= limit) break;
    }
  } catch (err) {
    console.warn('Similar tracks fetch error:', err);
  }

  return similarList;
}
