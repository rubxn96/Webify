import prisma from '@/lib/db/prisma';
import { Track } from '@/types';

/**
 * Strips YouTube-specific noise from video titles to get canonical song titles.
 */
export function cleanSongTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*\(Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|Lyrics|Visualizer)?\)/gi, '')
    .replace(/\s*\[Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|Lyrics|Visualizer)?\]/gi, '')
    .replace(/\s*\((?:Music\s*)?Video\)/gi, '')
    .replace(/\s*\[(?:Music\s*)?Video\]/gi, '')
    .replace(/\s*\((?:Lyric\s*Video|Lyrics|Audio|Visualizer|Audio\s*Visualizer)\)/gi, '')
    .replace(/\s*\[(?:Lyric\s*Video|Lyrics|Audio|Visualizer|Audio\s*Visualizer)\]/gi, '')
    .replace(/\s*\((?:HD|4K|HQ|Remastered|Explicit|Clean)\)/gi, '')
    .replace(/\s*\[(?:HD|4K|HQ|Remastered|Explicit|Clean)\]/gi, '')
    .replace(/\s*\|\s*Official\s*.*$/gi, '')
    .replace(/\s*-\s*Official\s*.*$/gi, '')
    .trim();
}

export function normalizeKey(str: string): string {
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

function extractYouTubeId(input: string): string | null {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }
  const match = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

/**
 * Fetches single track metadata from YouTube for direct URL or ID.
 */
async function fetchDirectYouTubeVideo(videoId: string): Promise<Track | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();

      let title = data.title || 'YouTube Track';
      let artist = data.author_name || 'YouTube Creator';

      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = cleanSongTitle(parts.slice(1).join(' - '));
      } else {
        title = cleanSongTitle(title);
      }

      // Upsert into local database
      const upserted = await prisma.track.upsert({
        where: { youtubeId: videoId },
        update: {},
        create: {
          youtubeId: videoId,
          title,
          artist,
          duration: 210,
          thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          embedding: JSON.stringify([0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2]),
        },
      });

      return {
        id: upserted.id,
        youtubeId: videoId,
        title: upserted.title,
        artist: upserted.artist,
        duration: upserted.duration,
        thumbnail: upserted.thumbnail,
        source: 'youtube',
      };
    }
  } catch {
    // Continue
  }
  return null;
}

/**
 * Searches YouTube directly and deduplicates lyrical/audio duplicates of the same song.
 */
export async function searchYouTubeDirect(query: string, limit: number = 25): Promise<Track[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const isExplicitLyricsSearch = query.toLowerCase().includes('lyrics');

    const q = encodeURIComponent(query);
    const res = await fetch(`https://www.youtube.com/results?search_query=${q}`, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();
    const match =
      html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    if (!Array.isArray(contents)) return [];

    const results: Track[] = [];
    const seenSongSignatures = new Set<string>();
    const seenCleanTitles = new Set<string>();

    for (const section of contents) {
      const itemSection = section.itemSectionRenderer?.contents;
      if (Array.isArray(itemSection)) {
        for (const item of itemSection) {
          const vr = item.videoRenderer;
          if (vr && vr.videoId) {
            let rawTitle = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || vr.title?.simpleText || 'Unknown';
            let artist = vr.ownerText?.runs?.map((r: { text: string }) => r.text).join('') || 'YouTube';
            const durationText = vr.lengthText?.simpleText;
            const duration = parseDurationText(durationText);

            // Filter out 1-hour loops or 10-hour videos
            if (duration > 1200 && !query.toLowerCase().includes('mix') && !query.toLowerCase().includes('hour')) {
              continue;
            }

            let title = rawTitle;
            // When title is "Artist - Title", extract true artist
            if (rawTitle.includes(' - ')) {
              const parts = rawTitle.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ');
            }

            const cleanedTitle = cleanSongTitle(title);
            const normTitle = normalizeKey(cleanedTitle);
            const normArtist = normalizeKey(artist);
            const songKey = `${normArtist}:::${normTitle}`;

            // Deduplication: If we already have this exact song (or lyrical clone of it), skip!
            if (seenSongSignatures.has(songKey) || (seenCleanTitles.has(normTitle) && !isExplicitLyricsSearch)) {
              continue;
            }

            seenSongSignatures.add(songKey);
            seenCleanTitles.add(normTitle);

            const thumbnail =
              vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://img.youtube.com/vi/${vr.videoId}/hqdefault.jpg`;

            results.push({
              id: `yt-${vr.videoId}`,
              youtubeId: vr.videoId,
              title: cleanedTitle || title,
              artist,
              duration,
              thumbnail,
              source: 'youtube',
            });

            if (results.length >= limit) break;
          }
        }
      }
      if (results.length >= limit) break;
    }

    return results;
  } catch (err) {
    console.warn('YouTube direct search error:', err);
    return [];
  }
}

/**
 * Searches YouTube via Piped / Invidious API mirrors as backup.
 */
async function searchYouTubeMirrors(query: string, limit: number = 20): Promise<Track[]> {
  const mirrors = [
    `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    `https://api.piped.privacy.com.de/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
  ];

  for (const url of mirrors) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        if (Array.isArray(items)) {
          return items
            .filter((item) => item.type === 'stream' || item.type === 'video' || item.url?.includes('watch?v='))
            .map((item) => {
              const vId = item.videoId || item.url?.replace('/watch?v=', '') || '';
              return {
                id: `yt-${vId}`,
                youtubeId: vId,
                title: cleanSongTitle(item.title),
                artist: item.uploaderName || item.author || 'YouTube Artist',
                duration: item.duration || item.lengthSeconds || 180,
                thumbnail: item.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                source: 'youtube' as const,
              };
            })
            .slice(0, limit);
        }
      }
    } catch {
      // try next mirror
    }
  }
  return [];
}

/**
 * Unified Search API: Combines local catalog and live YouTube audio search.
 */
export async function searchTracks(
  query: string,
  limit: number = 25,
  sourceFilter: 'all' | 'youtube' | 'catalog' = 'all'
): Promise<Track[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.trim();

  // 1. Direct YouTube URL or Video ID
  const directId = extractYouTubeId(cleanQ);
  if (directId) {
    const directTrack = await fetchDirectYouTubeVideo(directId);
    if (directTrack) {
      return [directTrack];
    }
  }

  const results: Track[] = [];
  const seenYouTubeIds = new Set<string>();
  const seenSongKeys = new Set<string>();
  const seenCleanTitles = new Set<string>();

  // 2. Local Database Catalog
  if (sourceFilter !== 'youtube') {
    const localTracks = await prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: cleanQ } },
          { artist: { contains: cleanQ } },
          { album: { contains: cleanQ } },
          { isrc: { contains: cleanQ } },
        ],
      },
      take: limit,
    });

    for (const t of localTracks) {
      const normTitle = normalizeKey(cleanSongTitle(t.title));
      const songKey = `${normalizeKey(t.artist)}:::${normTitle}`;
      seenSongKeys.add(songKey);
      seenCleanTitles.add(normTitle);
      seenYouTubeIds.add(t.youtubeId);

      results.push({
        id: t.id,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album || undefined,
        isrc: t.isrc || undefined,
        duration: t.duration,
        thumbnail: t.thumbnail,
        embedding: t.embedding ? JSON.parse(t.embedding) : undefined,
        lyrics: t.lyrics || undefined,
        source: 'catalog',
      });
    }
  }

  // 3. Live Results from YouTube
  if (sourceFilter !== 'catalog') {
    let ytResults = await searchYouTubeDirect(cleanQ, limit);

    if (ytResults.length === 0) {
      ytResults = await searchYouTubeMirrors(cleanQ, limit);
    }

    for (const yt of ytResults) {
      const normTitle = normalizeKey(cleanSongTitle(yt.title));
      const songKey = `${normalizeKey(yt.artist)}:::${normTitle}`;

      // Strictly deduplicate so the user gets distinct songs, NOT duplicate lyric versions of the same query!
      if (!seenYouTubeIds.has(yt.youtubeId) && !seenSongKeys.has(songKey) && !seenCleanTitles.has(normTitle)) {
        seenYouTubeIds.add(yt.youtubeId);
        seenSongKeys.add(songKey);
        seenCleanTitles.add(normTitle);
        results.push(yt);
      }
      if (results.length >= limit) break;
    }
  }

  return results;
}
