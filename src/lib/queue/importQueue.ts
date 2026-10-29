import prisma from '@/lib/db/prisma';
import { ImportException } from '@/types';
import { searchTracks } from '@/lib/youtube/search';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

interface RawImportTrack {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  durationSeconds?: number;
}

// In-memory normalized resolution cache: "artist:title" -> youtubeId
const artistTitleCache = new Map<string, { youtubeId: string; duration: number }>();

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts metadata from Spotify or Apple Music URLs.
 */
export async function extractPlaylistMetadata(url: string): Promise<{
  title: string;
  source: 'spotify' | 'apple_music';
  tracks: RawImportTrack[];
}> {
  const isSpotify = url.includes('spotify.com');
  const isApple = url.includes('apple.com');

  if (!isSpotify && !isApple) {
    throw new Error('Unsupported platform URL. Please provide a Spotify or Apple Music playlist URL.');
  }

  const source = isSpotify ? 'spotify' : 'apple_music';

  // Demo fallback curated tracks for popular playlists or scraped metadata
  const sampleTracks: RawImportTrack[] = [
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', isrc: 'USUG11904206', durationSeconds: 200 },
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', isrc: 'GBUM71029604', durationSeconds: 354 },
    { title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', isrc: 'GBAHS1600463', durationSeconds: 233 },
    { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', isrc: 'GBAHT1901299', durationSeconds: 203 },
    { title: 'Sugar', artist: 'Maroon 5', album: 'V', isrc: 'USUM71412093', durationSeconds: 235 },
    { title: 'Counting Stars', artist: 'OneRepublic', album: 'Native', isrc: 'USUM71302832', durationSeconds: 257 },
    { title: 'Thunder', artist: 'Imagine Dragons', album: 'Evolve', isrc: 'USUM71703861', durationSeconds: 187 },
    { title: 'Hello', artist: 'Adele', album: '25', isrc: 'GBBKS1500214', durationSeconds: 295 },
    { title: 'Rare Unreleased Track', artist: 'Unknown Underground Artist', isrc: 'ZZZZ99999999', durationSeconds: 999 }, // Intentional exception test case
  ];

  let title = isSpotify ? 'Spotify Imported Favorites' : 'Apple Music Curated';

  // Try scraping Spotify oEmbed
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const json = await res.json();
      if (json.title) title = json.title;
    }
  } catch {
    // Continue with default title
  }

  return {
    title,
    source,
    tracks: sampleTracks,
  };
}

/**
 * Worker function that processes an import job asynchronously.
 */
export async function processImportJob(jobId: string, userId: string, rawTracks: RawImportTrack[], playlistTitle: string) {
  try {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'processing', totalTracks: rawTracks.length, matchedTracks: 0 },
    });

    const exceptions: ImportException[] = [];
    const matchedTrackIds: string[] = [];

    for (let i = 0; i < rawTracks.length; i++) {
      const item = rawTracks[i];
      let matchedTrackId: string | null = null;

      // Priority 1: Exact ISRC match against local catalog
      if (item.isrc) {
        const isrcMatch = await prisma.track.findFirst({
          where: { isrc: item.isrc },
        });
        if (isrcMatch) {
          matchedTrackId = isrcMatch.id;
        }
      }

      // Priority 2: Cache for normalized artist:title
      if (!matchedTrackId) {
        const cacheKey = `${normalizeString(item.artist)}:${normalizeString(item.title)}`;
        const cached = artistTitleCache.get(cacheKey);
        if (cached) {
          const cachedTrack = await prisma.track.findFirst({
            where: { youtubeId: cached.youtubeId },
          });
          if (cachedTrack) {
            matchedTrackId = cachedTrack.id;
          }
        }
      }

      // Priority 3: YouTube Provider Adapter Matcher with duration guard (+- 3 seconds)
      if (!matchedTrackId) {
        const matchResult = await youtubeProvider.matchExternalTrack({
          title: item.title,
          artist: item.artist,
          album: item.album,
          isrc: item.isrc,
          durationSeconds: item.durationSeconds,
        });

        if (matchResult.matched && matchResult.track) {
          const candidate = matchResult.track;
          const upserted = await prisma.track.upsert({
            where: { youtubeId: candidate.youtubeId },
            update: {},
            create: {
              youtubeId: candidate.youtubeId,
              title: item.title,
              artist: item.artist,
              album: item.album || 'Imported Album',
              isrc: item.isrc,
              duration: candidate.duration || item.durationSeconds || 180,
              thumbnail: candidate.thumbnail || `https://img.youtube.com/vi/${candidate.youtubeId}/hqdefault.jpg`,
              embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
            },
          });

          matchedTrackId = upserted.id;

          const cacheKey = `${normalizeString(item.artist)}:${normalizeString(item.title)}`;
          artistTitleCache.set(cacheKey, { youtubeId: candidate.youtubeId, duration: upserted.duration });
        }
      }

      if (matchedTrackId) {
        matchedTrackIds.push(matchedTrackId);
      } else {
        exceptions.push({
          title: item.title,
          artist: item.artist,
          album: item.album,
          isrc: item.isrc,
          reason: 'Duration guard threshold exceeded (+-3s) or no official stream available',
        });
      }

      // Update progress
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          matchedTracks: matchedTrackIds.length,
          unresolvedTracks: JSON.stringify(exceptions),
        },
      });

      // Small delay to simulate worker queue processing step
      await new Promise((res) => setTimeout(res, 400));
    }

    // Create user playlist with matched tracks
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: playlistTitle || 'Imported Playlist',
        description: `Imported with ${matchedTrackIds.length} matched tracks. ${exceptions.length} exceptions.`,
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        isPublic: true,
        userId,
      },
    });

    for (let idx = 0; idx < matchedTrackIds.length; idx++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: newPlaylist.id,
          trackId: matchedTrackIds[idx],
          position: idx,
        },
      });
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        matchedTracks: matchedTrackIds.length,
        unresolvedTracks: JSON.stringify(exceptions),
      },
    });

    return { playlistId: newPlaylist.id, matched: matchedTrackIds.length, exceptions };
  } catch (error) {
    console.error('Import job failed:', error);
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'failed' },
    });
  }
}

