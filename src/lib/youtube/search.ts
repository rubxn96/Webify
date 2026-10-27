import prisma from '@/lib/db/prisma';
import { Track } from '@/types';

export async function searchTracks(query: string, limit: number = 20): Promise<Track[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.trim();

  // 1. Search local catalog first (title, artist, album, isrc)
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

  const formattedLocal: Track[] = localTracks.map((t) => ({
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
  }));

  if (formattedLocal.length >= limit) {
    return formattedLocal;
  }

  // 2. Fetch external YouTube search via public mirror
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const searchUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(cleanQ)}&filter=music_songs`;
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        const externalTracks: Track[] = data.items
          .filter((item: { type?: string; url?: string }) => item.type === 'stream' || (item.url && item.url.includes('/watch?v=')))
          .map((item: { url: string; title: string; uploaderName: string; thumbnail: string; duration: number }) => {
            const vId = item.url.replace('/watch?v=', '');
            return {
              id: `yt-${vId}`,
              youtubeId: vId,
              title: item.title,
              artist: item.uploaderName || 'Unknown Artist',
              duration: item.duration || 180,
              thumbnail: item.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
            };
          });

        // Merge and deduplicate by youtubeId
        const existingIds = new Set(formattedLocal.map((t) => t.youtubeId));
        for (const ext of externalTracks) {
          if (!existingIds.has(ext.youtubeId)) {
            formattedLocal.push(ext);
            existingIds.add(ext.youtubeId);
            if (formattedLocal.length >= limit) break;
          }
        }
      }
    }
  } catch {
    // If external search timed out, return whatever local tracks matched
  }

  return formattedLocal;
}
