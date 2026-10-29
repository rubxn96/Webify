import { youtubeProvider } from '@/server/providers/youtube.adapter';

export interface AudioStreamResult {
  audioUrl: string | null;
  mimeType: string;
  bitrate: number;
  source: 'direct' | 'iframe';
  duration?: number;
}

/**
 * High-reliability stream resolver delegating to YouTubeProviderAdapter
 */
export async function resolveYouTubeAudio(
  videoId: string,
  preferredBitrate: 'auto' | 'normal' | 'high' = 'high'
): Promise<AudioStreamResult> {
  const result = await youtubeProvider.resolveStream(videoId, {
    tier: preferredBitrate === 'auto' ? 'high' : preferredBitrate,
  });

  return {
    audioUrl: result.audioUrl,
    mimeType: result.mimeType,
    bitrate: result.bitrate,
    source: result.source,
    duration: result.duration,
  };
}
