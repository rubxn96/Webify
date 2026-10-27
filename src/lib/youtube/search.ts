import prisma from '@/lib/db/prisma';
import { Track } from '@/types';

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
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }
  // URL matching
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

      // Parse "Artist - Title" format commonly used in music video titles
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').replace(/\(Official.*?\)/i, '').replace(/\[Official.*?\]/i, '').trim();
      }

      // Upsert into local database
      const upserted = await prisma.track.upsert({
        where: { youtubeId: videoId },
        update: {},
        create: {
          youtubeId: videoId,
          title,
          artist,
          duration: 210, // Default estimated runtime
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
 * Searches YouTube directly by scraping search results HTML / ytInitialData.
 */
async function searchYouTubeDirect(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

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

    for (const section of contents) {
      const itemSection = section.itemSectionRenderer?.contents;
      if (Array.isArray(itemSection)) {
        for (const item of itemSection) {
          const vr = item.videoRenderer;
          if (vr && vr.videoId) {
            let title = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || vr.title?.simpleText || 'Unknown';
            let artist = vr.ownerText?.runs?.map((r: { text: string }) => r.text).join('') || 'YouTube';
            const durationText = vr.lengthText?.simpleText;
            const duration = parseDurationText(durationText);
            const thumbnail =
              vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://img.youtube.com/vi/${vr.videoId}/hqdefault.jpg`;

            // Clean title & artist if title is formatted as "Artist - Title"
            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              if (!artist || artist.includes('Topic') || artist.includes('VEVO')) {
                artist = parts[0].trim();
              }
              title = parts.slice(1).join(' - ').replace(/\(Official.*?\)/i, '').replace(/\[Official.*?\]/i, '').trim();
            }

            results.push({
              id: `yt-${vr.videoId}`,
              youtubeId: vr.videoId,
              title,
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
                title: item.title,
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

  // 1. Check if user typed or pasted a YouTube URL or direct Video ID
  const directId = extractYouTubeId(cleanQ);
  if (directId) {
    const directTrack = await fetchDirectYouTubeVideo(directId);
    if (directTrack) {
      return [directTrack];
    }
  }

  const results: Track[] = [];
  const seenYouTubeIds = new Set<string>();

  // 2. Fetch Stored Database Catalog Tracks (unless sourceFilter === 'youtube')
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
      seenYouTubeIds.add(t.youtubeId);
    }
  }

  // 3. Fetch Live Results from YouTube (unless sourceFilter === 'catalog')
  if (sourceFilter !== 'catalog') {
    let ytResults = await searchYouTubeDirect(cleanQ, limit);

    // If direct YouTube scrape was empty, try mirrors
    if (ytResults.length === 0) {
      ytResults = await searchYouTubeMirrors(cleanQ, limit);
    }

    for (const yt of ytResults) {
      if (!seenYouTubeIds.has(yt.youtubeId)) {
        seenYouTubeIds.add(yt.youtubeId);
        results.push(yt);
      }
      if (results.length >= limit) break;
    }
  }

  return results;
}
