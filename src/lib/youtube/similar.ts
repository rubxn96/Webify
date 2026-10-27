import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { cleanSongTitle, normalizeKey, searchYouTubeDirect } from './search';
import { cosineSimilarity } from '../recommender/vectorEngine';

function parseDurationText(durationText?: string): number {
  if (!durationText) return 180;
  const parts = durationText.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 180;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 180;
}

/**
 * Generates similar tracks with respect to the currently playing song.
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
  const currentKey = `${normalizeKey(currentTrack.artist)}:::${normalizeKey(cleanSongTitle(currentTrack.title))}`;
  const currentCleanTitle = normalizeKey(cleanSongTitle(currentTrack.title));

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
        const emb = t.embedding ? JSON.parse(t.embedding) : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        let score = cosineSimilarity(targetEmbedding, emb);
        // Artist affinity bonus
        if (t.artist.toLowerCase().includes(currentTrack.artist.toLowerCase()) ||
            currentTrack.artist.toLowerCase().includes(t.artist.toLowerCase())) {
          score += 0.3;
        }
        return { track: t, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const item of scoredCatalog) {
      const t = item.track;
      const tClean = normalizeKey(cleanSongTitle(t.title));
      const songKey = `${normalizeKey(t.artist)}:::${tClean}`;

      // Strictly skip if it matches current song title
      if (tClean === currentCleanTitle || seenSongKeys.has(songKey)) continue;

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
    // Continue
  }

  // 2. Fetch related songs from YouTube (Search for similar hits by same or related artist)
  try {
    const cleanArtist = currentTrack.artist
      .replace(/Topic|VEVO|Official|Records|Music/gi, '')
      .trim();

    const ytResults = await searchYouTubeDirect(`${cleanArtist} greatest hits radio mix`, limit);

    for (const yt of ytResults) {
      const cleanedTitle = cleanSongTitle(yt.title);
      const songCleanTitle = normalizeKey(cleanedTitle);
      const songKey = `${normalizeKey(yt.artist)}:::${songCleanTitle}`;

      // CRITICAL: Strictly skip if this song is the SAME as current playing song
      // or if it's already in the list
      if (
        songCleanTitle === currentCleanTitle ||
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

