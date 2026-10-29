import { Ytdl } from '@distube/ytdl-core';
import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import {
  IMusicProviderAdapter,
  StreamResolutionOptions,
  StreamResolutionResult,
  TrackMetadataMatchQuery,
  TrackMatchResult,
} from './types';

interface CachedStream {
  audioUrl: string | null;
  rawStreamUrl?: string | null;
  mimeType: string;
  bitrate: number;
  duration?: number;
  source: 'direct' | 'iframe';
  expiresAt: number;
}

const STREAM_CACHE = new Map<string, CachedStream>();
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

const PIPED_MIRRORS = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacy.com.de',
  'https://piped-api.lunar.icu',
];

export {
  cleanNorm,
  cleanSongTitle,
  KNOWN_RECORD_LABELS,
  isRecordLabel,
  isCompilationOrShow,
  isPristineSongTrack,
} from '@/lib/youtube/songFilter';
import {
  cleanNorm,
  cleanSongTitle,
  isRecordLabel,
  isPristineSongTrack,
} from '@/lib/youtube/songFilter';

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

export class YouTubeProviderAdapter implements IMusicProviderAdapter {
  private ytdl: Ytdl;

  constructor() {
    this.ytdl = new Ytdl();
  }

  /**
   * High-Reliability Stream Resolver
   * Resolves native audio-only stream with 2500ms probe timeout and 45-minute in-memory cache.
   */
  public async resolveStream(
    youtubeId: string,
    options: StreamResolutionOptions = {}
  ): Promise<StreamResolutionResult> {
    const tier = options.tier || 'high';
    const preferredFormat = options.preferredFormat || 'any';
    const cacheKey = `${youtubeId}:${preferredFormat}:${tier}`;

    const cached = STREAM_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        audioUrl: cached.audioUrl,
        rawStreamUrl: cached.rawStreamUrl,
        mimeType: cached.mimeType,
        bitrate: cached.bitrate,
        duration: cached.duration,
        source: cached.source,
        isProxied: cached.source === 'direct',
      };
    }

    // Try @distube/ytdl-core direct extraction with 4500ms timeout
    try {
      const probePromise = this.resolveViaYtdl(youtubeId, preferredFormat, tier);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4500));

      const directResult = await Promise.race([probePromise, timeoutPromise]);
      if (directResult) {
        STREAM_CACHE.set(cacheKey, {
          ...directResult,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return {
          ...directResult,
          isProxied: true,
        };
      }
    } catch (err) {
      console.warn(`[YouTubeProvider] ytdl-core probe failed for ${youtubeId}:`, err);
    }

    // Secondary fast fallback: Piped public audioStreams probe
    try {
      const pipedResult = await this.resolveViaPiped(youtubeId, 1000);
      if (pipedResult) {
        STREAM_CACHE.set(cacheKey, {
          ...pipedResult,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return {
          ...pipedResult,
          isProxied: true,
        };
      }
    } catch (err) {
      console.warn(`[YouTubeProvider] piped fallback failed for ${youtubeId}:`, err);
    }

    // Fallback: YouTube IFrame mode
    const fallback: StreamResolutionResult = {
      audioUrl: null,
      rawStreamUrl: null,
      mimeType: 'audio/youtube-iframe',
      bitrate: 160,
      source: 'iframe',
      isProxied: false,
    };

    STREAM_CACHE.set(cacheKey, {
      ...fallback,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return fallback;
  }

  /**
   * Retrieve cached direct stream URL for proxy forwarding
   */
  public getCachedRawStreamUrl(youtubeId: string, preferredFormat?: string): string | null {
    if (preferredFormat && preferredFormat !== 'any') {
      const specificPrefix = `${youtubeId}:${preferredFormat}:`;
      for (const [key, entry] of STREAM_CACHE.entries()) {
        if (key.startsWith(specificPrefix) && entry.rawStreamUrl && entry.expiresAt > Date.now()) {
          return entry.rawStreamUrl;
        }
      }
    }
    for (const [key, entry] of STREAM_CACHE.entries()) {
      if (key.startsWith(youtubeId) && entry.rawStreamUrl && entry.expiresAt > Date.now()) {
        return entry.rawStreamUrl;
      }
    }
    return null;
  }

  private async resolveViaYtdl(
    youtubeId: string,
    preferredFormat: 'mp4' | 'webm' | 'any',
    tier: 'high' | 'normal' | 'low'
  ): Promise<StreamResolutionResult | null> {
    const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const info = await this.ytdl.getInfo(videoUrl);

    if (!info || !Array.isArray(info.formats) || info.formats.length === 0) {
      return null;
    }

    // Filter to audio-capable formats
    const audioFormats = info.formats.filter(
      (f) => f.hasAudio && (!f.hasVideo || (f.mimeType && f.mimeType.startsWith('audio/')))
    );

    if (audioFormats.length === 0) return null;

    let chosen = null;

    if (preferredFormat === 'mp4') {
      const mp4Formats = audioFormats
        .filter((f) => f.mimeType?.includes('audio/mp4') || f.container === 'mp4')
        .sort((a, b) => (b.audioBitrate || b.bitrate || 0) - (a.audioBitrate || a.bitrate || 0));
      if (mp4Formats.length > 0) chosen = mp4Formats[0];
    } else if (preferredFormat === 'webm') {
      const webmFormats = audioFormats
        .filter((f) => f.mimeType?.includes('audio/webm') || f.container === 'webm')
        .sort((a, b) => (b.audioBitrate || b.bitrate || 0) - (a.audioBitrate || a.bitrate || 0));
      if (webmFormats.length > 0) chosen = webmFormats[0];
    }

    if (!chosen) {
      // Pick highest bitrate audio format
      const sorted = [...audioFormats].sort(
        (a, b) => (b.audioBitrate || b.bitrate || 0) - (a.audioBitrate || a.bitrate || 0)
      );
      chosen = tier === 'low' ? sorted[sorted.length - 1] : sorted[0];
    }

    if (!chosen || !chosen.url) return null;

    const chosenFormat = chosen.container === 'webm' || chosen.mimeType?.includes('audio/webm') ? 'webm' : 'mp4';
    const mimeType = chosenFormat === 'mp4' ? 'audio/mp4' : (chosen.mimeType?.split(';')[0] || 'audio/webm');
    const rawBitrate = chosen.audioBitrate || chosen.bitrate || 160;
    const bitrate = rawBitrate > 1000 ? Math.round(rawBitrate / 1000) : rawBitrate;
    const duration = info.videoDetails?.lengthSeconds ? Number(info.videoDetails.lengthSeconds) : undefined;

    return {
      audioUrl: `/api/stream/proxy?id=${youtubeId}&tier=${tier}&format=${chosenFormat}`,
      rawStreamUrl: chosen.url,
      mimeType,
      bitrate,
      duration,
      source: 'direct',
    };
  }

  private async resolveViaPiped(youtubeId: string, timeoutMs: number): Promise<StreamResolutionResult | null> {
    for (const mirror of PIPED_MIRRORS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`${mirror}/streams/${youtubeId}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        clearTimeout(timer);

        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
          const streams = data.audioStreams.sort(
            (a: { bitrate: number }, b: { bitrate: number }) => b.bitrate - a.bitrate
          );
          const chosen = streams[0];
          if (chosen && chosen.url) {
            const pipedFormat = chosen.mimeType?.includes('mp4') ? 'mp4' : 'webm';
            return {
              audioUrl: `/api/stream/proxy?id=${youtubeId}&tier=high&format=${pipedFormat}`,
              rawStreamUrl: chosen.url,
              mimeType: chosen.mimeType || (pipedFormat === 'mp4' ? 'audio/mp4' : 'audio/webm'),
              bitrate: Math.round((chosen.bitrate || 160000) / 1000),
              source: 'direct',
              duration: data.duration,
            };
          }
        }
      } catch {
        // try next mirror
      }
    }
    return null;
  }

  /**
   * Scrapes native YouTube Mix (RDAMVM / RD) playlist for a track.
   * Deduplicates using cleanNorm(title) and discards identical/clone titles.
   */
  public async scrapeRelatedMix(seedTrackId: string, limit: number = 20): Promise<Track[]> {
    const mixTracks: Track[] = [];
    const seenSongKeys = new Set<string>();
    const seenCleanTitles = new Set<string>();
    const seenIds = new Set<string>([seedTrackId]);

    try {
      const url = `https://www.youtube.com/watch?v=${seedTrackId}&list=RD${seedTrackId}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timer);

      if (res.ok) {
        const html = await res.text();
        const match =
          html.match(/ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
          html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

        if (match) {
          const data = JSON.parse(match[1]);
          const contents =
            data.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents || [];

          for (const item of contents) {
            const renderer = item.playlistPanelVideoRenderer;
            if (!renderer || !renderer.videoId) continue;

            const videoId = renderer.videoId;
            if (seenIds.has(videoId)) continue;

            let title = renderer.title?.simpleText || renderer.title?.runs?.map((r: { text: string }) => r.text).join('') || '';
            let artist = renderer.shortBylineText?.runs?.map((r: { text: string }) => r.text).join('') || 'Unknown';

            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ');
            }

            const cleanedTitle = cleanSongTitle(title);
            const normTitle = cleanNorm(cleanedTitle);
            const normArtist = cleanNorm(artist);
            const songKey = `${normArtist}:::${normTitle}`;

            if (seenSongKeys.has(songKey) || seenCleanTitles.has(normTitle)) continue;

            seenSongKeys.add(songKey);
            seenCleanTitles.add(normTitle);
            seenIds.add(videoId);

            const durationText = renderer.lengthText?.simpleText;
            const duration = parseDurationText(durationText);

            // Strictly drop any compilations, radio shows, jukeboxes, or tracks outside single song bounds (80s - 450s)
            if (!isPristineSongTrack({ title, artist, duration })) {
              continue;
            }

            const thumbnail =
              renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            mixTracks.push({
              id: `yt-${videoId}`,
              youtubeId: videoId,
              title: cleanedTitle || title,
              artist,
              duration,
              thumbnail,
              source: 'youtube',
            });

            if (mixTracks.length >= limit) break;
          }
        }
      }
    } catch (err) {
      console.warn(`[YouTubeProvider] scrapeRelatedMix failed for ${seedTrackId}:`, err);
    }

    // Fallback if mix scraping yielded insufficient tracks
    if (mixTracks.length < 5) {
      try {
        const seedTrack = await prisma.track.findUnique({ where: { youtubeId: seedTrackId } });
        if (seedTrack) {
          const cleanArtist = seedTrack.artist.replace(/Topic|VEVO|Official|Records|Music/gi, '').trim();
          if (!isRecordLabel(cleanArtist) && cleanArtist.length > 2) {
            const fallbackTracks = await this.search(`${cleanArtist} songs`, limit);
            for (const fb of fallbackTracks) {
              if (!seenIds.has(fb.youtubeId) && isPristineSongTrack(fb)) {
                seenIds.add(fb.youtubeId);
                mixTracks.push(fb);
              }
              if (mixTracks.length >= limit) break;
            }
          }
        }
      } catch {
        // Continue with whatever mix tracks we gathered
      }
    }

    return mixTracks;
  }

  /**
   * Search YouTube and filter out duplicate versions and lyrical clones
   */
  public async search(query: string, limit: number = 25): Promise<Track[]> {
    if (!query || !query.trim()) return [];
    const cleanQ = query.trim();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQ)}`, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timer);

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
      const seenSongKeys = new Set<string>();
      const seenCleanTitles = new Set<string>();
      const isExplicitLyricsSearch = cleanQ.toLowerCase().includes('lyrics');

      for (const section of contents) {
        const itemSection = section.itemSectionRenderer?.contents;
        if (Array.isArray(itemSection)) {
          for (const item of itemSection) {
            const vr = item.videoRenderer;
            if (!vr || !vr.videoId) continue;

            let rawTitle = vr.title?.runs?.map((r: { text: string }) => r.text).join('') || vr.title?.simpleText || 'Unknown';
            let artist = vr.ownerText?.runs?.map((r: { text: string }) => r.text).join('') || 'YouTube';
            const duration = parseDurationText(vr.lengthText?.simpleText);

            const allowLongFormat = /\b(?:full\s+album|discography|podcast|entire\s+album)\b/i.test(cleanQ);
            if (!allowLongFormat && !isPristineSongTrack({ title: rawTitle, artist, duration })) {
              continue;
            }

            let title = rawTitle;
            if (rawTitle.includes(' - ')) {
              const parts = rawTitle.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ');
            }

            const cleanedTitle = cleanSongTitle(title);
            const normTitle = cleanNorm(cleanedTitle);
            const normArtist = cleanNorm(artist);
            const songKey = `${normArtist}:::${normTitle}`;

            if (seenSongKeys.has(songKey) || (seenCleanTitles.has(normTitle) && !isExplicitLyricsSearch)) {
              continue;
            }

            seenSongKeys.add(songKey);
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
        if (results.length >= limit) break;
      }

      return results;
    } catch (err) {
      console.warn('[YouTubeProvider] search error:', err);
      return [];
    }
  }

  /**
   * Matches external track metadata with ISRC or ±3s duration-guarded YouTube search
   */
  public async matchExternalTrack(query: TrackMetadataMatchQuery): Promise<TrackMatchResult> {
    // 1. ISRC exact match in catalog
    if (query.isrc) {
      const match = await prisma.track.findFirst({
        where: { isrc: query.isrc },
      });
      if (match) {
        return {
          matched: true,
          trackId: match.id,
          track: {
            id: match.id,
            youtubeId: match.youtubeId,
            title: match.title,
            artist: match.artist,
            album: match.album || undefined,
            isrc: match.isrc || undefined,
            duration: match.duration,
            thumbnail: match.thumbnail,
            lyrics: match.lyrics || undefined,
            source: 'catalog',
          },
          confidence: 1.0,
        };
      }
    }

    // 2. Query YouTube with ±3s duration guard
    const searchQuery = `${query.artist} ${query.title}`;
    const candidates = await this.search(searchQuery, 8);

    const normTargetTitle = cleanNorm(query.title);
    const normTargetArtist = cleanNorm(query.artist);

    for (const cand of candidates) {
      const normCandTitle = cleanNorm(cand.title);
      const normCandArtist = cleanNorm(cand.artist);

      const titleMatches = normCandTitle.includes(normTargetTitle) || normTargetTitle.includes(normCandTitle);
      const artistMatches = normCandArtist.includes(normTargetArtist) || normTargetArtist.includes(normCandArtist);

      // Duration guard (±3 seconds) if target duration is known
      const durationMatches =
        query.durationSeconds && query.durationSeconds > 0
          ? Math.abs(cand.duration - query.durationSeconds) <= 3
          : true;

      if (titleMatches && (artistMatches || durationMatches)) {
        return {
          matched: true,
          track: cand,
          confidence: durationMatches && artistMatches ? 0.95 : 0.85,
        };
      }
    }

    // 3. Fallback to top result if reasonable title overlap exists
    if (candidates.length > 0) {
      const top = candidates[0];
      const normTopTitle = cleanNorm(top.title);
      if (normTopTitle.includes(normTargetTitle) || normTargetTitle.includes(normTopTitle)) {
        return {
          matched: true,
          track: top,
          confidence: 0.75,
        };
      }
    }

    return { matched: false, confidence: 0 };
  }
}

export const youtubeProvider = new YouTubeProviderAdapter();
