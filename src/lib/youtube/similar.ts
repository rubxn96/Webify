import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { cleanSongTitle } from './search';
import { cosineSimilarity } from '../recommender/vectorEngine';

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
  limit: number = 15
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

    const query = `${cleanArtist} songs mix playlist`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const match =
        html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
        html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

      if (match) {
        const data = JSON.parse(match[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

        if (Array.isArray(contents)) {
          for (const section of contents) {
            const itemSection = section.itemSectionRenderer?.contents;
            if (Array.isArray(itemSection)) {
              for (const item of itemSection) {
                const vr = item.videoRenderer;
                if (vr && vr.videoId) {
                  let rawTitle = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || vr.title?.simpleText || '';
                  let artist = vr.ownerText?.runs?.map((r: { text: string }) => r.text).join('') || cleanArtist;
                  const duration = parseDurationText(vr.lengthText?.simpleText);

                  // Skip 1-hour loops
                  if (duration > 900) continue;

                  let title = rawTitle;
                  if (rawTitle.includes(' - ')) {
                    const parts = rawTitle.split(' - ');
                    if (!artist || artist.includes('Topic') || artist.includes('VEVO')) {
                      artist = parts[0].trim();
                    }
                    title = parts.slice(1).join(' - ');
                  }

                  const cleanedTitle = cleanSongTitle(title);
                  const songCleanTitle = normalizeKey(cleanedTitle);
                  const songKey = `${normalizeKey(artist)}:::${songCleanTitle}`;

                  // CRITICAL: Strictly skip if this song is the SAME as current playing song
                  // or if it's a lyrical/audio duplicate!
                  if (
                    songCleanTitle === currentCleanTitle ||
                    seenSongKeys.has(songKey) ||
                    seenYouTubeIds.has(vr.videoId) ||
                    rawTitle.toLowerCase().includes('lyrics')
                  ) {
                    continue;
                  }

                  seenSongKeys.add(songKey);
                  seenYouTubeIds.add(vr.videoId);

                  similarList.push({
                    id: `yt-${vr.videoId}`,
                    youtubeId: vr.videoId,
                    title: cleanedTitle || title,
                    artist,
                    duration,
                    thumbnail:
                      vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                      `https://img.youtube.com/vi/${vr.videoId}/hqdefault.jpg`,
                    source: 'youtube',
                  });

                  if (similarList.length >= limit) break;
                }
              }
            }
            if (similarList.length >= limit) break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Similar tracks fetch error:', err);
  }

  return similarList;
}

