// In-memory cache for audio stream URLs with TTL (1 hour)
interface StreamCacheEntry {
  audioUrl: string | null;
  mimeType: string;
  bitrate: number;
  source: 'direct' | 'iframe';
  expiresAt: number;
}

const streamCache = new Map<string, StreamCacheEntry>();

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://yt.drgnz.club',
  'https://inv.vern.cc',
  'https://invidious.snopyta.org',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacy.com.de',
  'https://piped-api.lunar.icu',
];

export interface AudioStreamResult {
  audioUrl: string | null;
  mimeType: string;
  bitrate: number;
  source: 'direct' | 'iframe';
  duration?: number;
}

/**
 * Resolves high quality audio manifest for a YouTube Video ID.
 * Tries direct public stream manifests first; falls back cleanly to iframe mode.
 */
export async function resolveYouTubeAudio(
  videoId: string,
  preferredBitrate: 'auto' | 'normal' | 'high' = 'high'
): Promise<AudioStreamResult> {
  // 1. Check cache
  const cached = streamCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      audioUrl: cached.audioUrl,
      mimeType: cached.mimeType,
      bitrate: cached.bitrate,
      source: cached.source,
    };
  }

  // 2. Try Piped API instances
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
          // Sort by bitrate descending or matching preferredBitrate
          const streams = data.audioStreams.sort((a: { bitrate: number }, b: { bitrate: number }) => b.bitrate - a.bitrate);
          const chosen = preferredBitrate === 'normal' 
            ? streams.find((s: { bitrate: number }) => s.bitrate <= 130000) || streams[0] 
            : streams[0];

          if (chosen && chosen.url) {
            const result: AudioStreamResult = {
              audioUrl: chosen.url,
              mimeType: chosen.mimeType || 'audio/webm',
              bitrate: Math.round((chosen.bitrate || 160000) / 1000),
              source: 'direct',
              duration: data.duration,
            };

            // Cache for 45 minutes
            streamCache.set(videoId, {
              ...result,
              expiresAt: Date.now() + 45 * 60 * 1000,
            });

            return result;
          }
        }
      }
    } catch {
      // Continue to next mirror
    }
  }

  // 3. Try Invidious API instances
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.adaptiveFormats)) {
          const audioFormats = data.adaptiveFormats
            .filter((f: { type: string }) => f.type && f.type.startsWith('audio/'))
            .sort((a: { bitrate: number }, b: { bitrate: number }) => (b.bitrate || 0) - (a.bitrate || 0));

          if (audioFormats.length > 0 && audioFormats[0].url) {
            const chosen = audioFormats[0];
            const result: AudioStreamResult = {
              audioUrl: chosen.url,
              mimeType: chosen.type || 'audio/webm',
              bitrate: Math.round((chosen.bitrate || 160000) / 1000),
              source: 'direct',
              duration: data.lengthSeconds,
            };

            streamCache.set(videoId, {
              ...result,
              expiresAt: Date.now() + 45 * 60 * 1000,
            });

            return result;
          }
        }
      }
    } catch {
      // Continue to next
    }
  }

  // 4. Default to Embedded Iframe Fallback Mode
  // When restricted or direct stream manifest unavailable, hidden YouTube Iframe API plays perfectly!
  const fallbackResult: AudioStreamResult = {
    audioUrl: null,
    mimeType: 'audio/youtube-iframe',
    bitrate: 160,
    source: 'iframe',
  };

  streamCache.set(videoId, {
    ...fallbackResult,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return fallbackResult;
}

