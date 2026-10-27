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

  // Fast direct stream probe (500ms max timeout to prevent blocking playback)
  try {
    const probeController = new AbortController();
    const probeTimeout = setTimeout(() => probeController.abort(), 500);

    const fastProbe = fetch(`${PIPED_INSTANCES[0]}/streams/${videoId}`, {
      signal: probeController.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
          const streams = data.audioStreams.sort(
            (a: { bitrate: number }, b: { bitrate: number }) => b.bitrate - a.bitrate
          );
          const chosen = streams[0];
          if (chosen && chosen.url) {
            return {
              audioUrl: chosen.url,
              mimeType: chosen.mimeType || 'audio/webm',
              bitrate: Math.round((chosen.bitrate || 160000) / 1000),
              source: 'direct' as const,
              duration: data.duration,
            };
          }
        }
        return null;
      })
      .catch(() => null)
      .finally(() => clearTimeout(probeTimeout));

    const result = await fastProbe;
    if (result) {
      streamCache.set(videoId, { ...result, expiresAt: Date.now() + 45 * 60 * 1000 });
      return result;
    }
  } catch {
    // Continue directly to iframe
  }

  // Fast, instant embedded playback mode (starts immediately without double-tap or lag)
  const fallbackResult: AudioStreamResult = {
    audioUrl: null,
    mimeType: 'audio/youtube-iframe',
    bitrate: 160,
    source: 'iframe',
  };

  streamCache.set(videoId, {
    ...fallbackResult,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return fallbackResult;
}

