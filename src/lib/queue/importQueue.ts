import prisma from '@/lib/db/prisma';
import { ImportException } from '@/types';
import { youtubeProvider } from '@/server/providers/youtube.adapter';
import { cleanNorm } from '@/lib/youtube/songFilter';

export interface RawImportTrack {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  durationSeconds?: number;
}

export interface ExtractedPlaylistMetadata {
  title: string;
  source: 'spotify' | 'apple_music';
  coverImage?: string;
  tracks: RawImportTrack[];
}

// In-memory normalized resolution cache: "artist:title" -> youtubeId
const artistTitleCache = new Map<string, { youtubeId: string; duration: number }>();

/**
 * Extracts all tracks and artwork metadata directly from Spotify or Apple Music URLs.
 * Works natively without requiring paid developer credentials by parsing embedded hydration payloads.
 */
export async function extractPlaylistMetadata(url: string): Promise<ExtractedPlaylistMetadata> {
  const isSpotify = url.includes('spotify.com') || url.startsWith('spotify:');
  const isApple = url.includes('apple.com');

  if (!isSpotify && !isApple) {
    throw new Error('Unsupported platform URL. Please provide a Spotify or Apple Music playlist link.');
  }

  const source: 'spotify' | 'apple_music' = isSpotify ? 'spotify' : 'apple_music';
  let title = isSpotify ? 'Spotify Playlist' : 'Apple Music Playlist';
  let coverImage: string | undefined = undefined;
  const tracks: RawImportTrack[] = [];

  if (isSpotify) {
    const match = url.match(/(playlist|album|track)[\/:]([a-zA-Z0-9]+)/i);
    if (!match) {
      throw new Error('Invalid Spotify link. Could not extract playlist, album, or track ID.');
    }

    const type = match[1].toLowerCase();
    const id = match[2];

    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
      if (nextMatch) {
        try {
          const data = JSON.parse(nextMatch[1]);
          const entity = data.props?.pageProps?.state?.data?.entity;
          if (entity) {
            title = entity.name || entity.title || title;
            coverImage =
              entity.coverArt?.sources?.[0]?.url ||
              entity.visualIdentity?.image?.[1]?.url ||
              entity.visualIdentity?.image?.[0]?.url;

            const rawTrackList = entity.trackList || [];
            for (const item of rawTrackList) {
              const trackTitle = item.title || item.name;
              const artist =
                item.subtitle ||
                (Array.isArray(item.artists)
                  ? item.artists.map((a: { name: string }) => a.name).join(', ')
                  : 'Unknown Artist');
              const durationSeconds = item.duration
                ? Math.round(item.duration / 1000)
                : 180;

              if (trackTitle) {
                tracks.push({
                  title: trackTitle,
                  artist: artist,
                  album: entity.name || undefined,
                  durationSeconds,
                  isrc: item.isrc,
                });
              }
            }

            // If single track embed
            if (tracks.length === 0 && (entity.title || entity.name)) {
              tracks.push({
                title: entity.title || entity.name,
                artist: entity.subtitle || 'Unknown Artist',
                durationSeconds: entity.duration ? Math.round(entity.duration / 1000) : 180,
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing Spotify embed JSON:', e);
        }
      }
    }

    // Fallback: oEmbed title and thumbnail if needed
    if (!coverImage || title === 'Spotify Playlist') {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (oembedRes.ok) {
          const json = await oembedRes.json();
          if (json.title && title === 'Spotify Playlist') {
            title = json.title;
          }
          if (json.thumbnail_url && !coverImage) {
            coverImage = json.thumbnail_url;
          }
        }
      } catch {}
    }
  } else if (isApple) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const serverData = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]+?)<\/script>/);
      if (serverData) {
        try {
          const data = JSON.parse(serverData[1]);
          const d0 = data.data?.[0];
          const sections = d0?.data?.sections || [];
          for (const s of sections) {
            if (Array.isArray(s.items) && s.items.length > 1) {
              for (const it of s.items) {
                const trackTitle = it.title || it.name;
                const artist = it.artistName || it.subtitle || 'Unknown Artist';
                if (trackTitle && artist !== 'Unknown Artist') {
                  tracks.push({
                    title: trackTitle,
                    artist,
                    album: it.albumName,
                    durationSeconds: it.duration ? Math.round(it.duration / 1000) : 180,
                  });
                }
              }
            } else if (s.items?.[0]?.title && title === 'Apple Music Playlist') {
              title = s.items[0].title;
            }
          }
        } catch (e) {
          console.warn('Apple music parse error:', e);
        }
      }
    }
  }

  return { title, source, coverImage, tracks };
}

/**
 * Worker function that processes an import job asynchronously.
 * Resolves each track against YouTube music, links them to the user's playlist,
 * and maintains accurate live progress updates in the database.
 */
export async function processImportJob(
  jobId: string,
  userId: string,
  rawTracks: RawImportTrack[],
  playlistTitle: string,
  coverImage?: string
) {
  try {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'processing', totalTracks: rawTracks.length, matchedTracks: 0 },
    });

    const exceptions: ImportException[] = [];
    const matchedTrackIds: string[] = [];

    // Helper to resolve a single external track
    const matchSingleTrack = async (item: RawImportTrack): Promise<string | null> => {
      // Priority 1: Exact ISRC match in database
      if (item.isrc) {
        const isrcMatch = await prisma.track.findFirst({
          where: { isrc: item.isrc },
        });
        if (isrcMatch) {
          return isrcMatch.id;
        }
      }

      // Priority 2: In-memory cache
      const cacheKey = `${cleanNorm(item.artist)}:${cleanNorm(item.title)}`;
      const cached = artistTitleCache.get(cacheKey);
      if (cached) {
        const cachedTrack = await prisma.track.findFirst({
          where: { youtubeId: cached.youtubeId },
        });
        if (cachedTrack) {
          return cachedTrack.id;
        }
      }

      // Priority 3: YouTube Provider Adapter Matcher
      try {
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

          artistTitleCache.set(cacheKey, {
            youtubeId: candidate.youtubeId,
            duration: upserted.duration,
          });

          return upserted.id;
        }
      } catch (err) {
        console.warn(`[ImportJob] Match failed for "${item.title}":`, err);
      }

      return null;
    };

    // Process in parallel chunks of 3 for fast throughput without rate-limiting
    const CHUNK_SIZE = 3;
    for (let i = 0; i < rawTracks.length; i += CHUNK_SIZE) {
      const chunk = rawTracks.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (item) => {
          const trackId = await matchSingleTrack(item);
          return { item, trackId };
        })
      );

      for (const res of results) {
        if (res.trackId) {
          matchedTrackIds.push(res.trackId);
        } else {
          exceptions.push({
            title: res.item.title,
            artist: res.item.artist,
            album: res.item.album,
            isrc: res.item.isrc,
            reason: 'Could not resolve playable standalone track on YouTube',
          });
        }
      }

      // Update live progress in DB
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          matchedTracks: matchedTrackIds.length,
          unresolvedTracks: JSON.stringify(exceptions),
        },
      });

      // Small throttle between chunks
      await new Promise((r) => setTimeout(r, 100));
    }

    // Create user playlist with all matched tracks
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: playlistTitle || 'Imported Playlist',
        description: `Imported playlist with ${matchedTrackIds.length} tracks.`,
        coverImage:
          coverImage ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
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
