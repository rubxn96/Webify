import prisma from '@/lib/db/prisma';
import { cleanSongTitle, cleanNorm, isPristineSongTrack, KNOWN_RECORD_LABELS } from '@/lib/youtube/songFilter';
import { youtubeProvider } from '../providers/youtube.adapter';

export interface VideoMappingResult {
  youtubeId: string;
  confidence: number;
  verified: boolean;
  title: string;
  artist: string;
  duration: number;
}

export class YouTubeVideoMapper {
  private readonly apiKey = process.env.YOUTUBE_API_KEY;

  /**
   * Resolves and maps verified YouTube Video ID for any track
   */
  public async mapTrackToYouTube(
    title: string,
    artist: string,
    targetDurationSeconds?: number
  ): Promise<VideoMappingResult | null> {
    const cleanTitle = cleanSongTitle(title);
    const queryKey = `${cleanNorm(artist)}:::${cleanNorm(cleanTitle)}`;

    // 1. Check database cache first
    try {
      const cached = await prisma.youTubeMapping.findUnique({
        where: { queryKey },
      });
      if (cached && cached.youtubeId) {
        return {
          youtubeId: cached.youtubeId,
          confidence: cached.confidence,
          verified: cached.verified,
          title: cached.title,
          artist: cached.artist,
          duration: cached.duration,
        };
      }
    } catch {
      // Continue to search
    }

    // 2. Perform search using YouTube Data API if key present, else YouTube Adapter
    let candidate = await this.searchViaYouTubeDataApi(cleanTitle, artist);
    if (!candidate) {
      candidate = await this.searchViaAdapter(cleanTitle, artist, targetDurationSeconds);
    }

    if (!candidate) return null;

    // 3. Cache verified mapping in PostgreSQL
    try {
      await prisma.youTubeMapping.upsert({
        where: { queryKey },
        create: {
          queryKey,
          youtubeId: candidate.youtubeId,
          title: candidate.title,
          artist: candidate.artist,
          duration: candidate.duration,
          confidence: candidate.confidence,
          verified: candidate.verified,
        },
        update: {
          youtubeId: candidate.youtubeId,
          confidence: candidate.confidence,
          verified: candidate.verified,
        },
      });
    } catch {
      // Non-critical cache write
    }

    return candidate;
  }

  private async searchViaYouTubeDataApi(title: string, artist: string): Promise<VideoMappingResult | null> {
    if (!this.apiKey) return null;

    try {
      const q = `${artist} ${title} official audio`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(
        q
      )}&maxResults=5&key=${this.apiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return null;

      const data = await res.json();
      const items = data?.items;

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const videoId = item.id?.videoId;
          const snippet = item.snippet;
          if (!videoId || !snippet) continue;

          const channel = snippet.channelTitle || '';
          const itemTitle = snippet.title || '';

          // Prefer official record labels or artist topics
          const isOfficialLabel =
            Array.from(KNOWN_RECORD_LABELS).some((l) => channel.toLowerCase().includes(l.toLowerCase())) ||
            channel.toLowerCase().includes('topic') ||
            channel.toLowerCase().includes('official');

          const isClean = isPristineSongTrack({ title: itemTitle, artist: channel, duration: 180 });
          if (!isClean) continue;

          return {
            youtubeId: videoId,
            confidence: isOfficialLabel ? 0.98 : 0.85,
            verified: isOfficialLabel,
            title: cleanSongTitle(itemTitle),
            artist: channel,
            duration: 180,
          };
        }
      }
    } catch {
      // Fallback to adapter
    }

    return null;
  }

  private async searchViaAdapter(
    title: string,
    artist: string,
    targetDuration?: number
  ): Promise<VideoMappingResult | null> {
    try {
      const match = await youtubeProvider.matchExternalTrack({
        title,
        artist,
        durationSeconds: targetDuration,
      });

      if (match?.matched && match.track?.youtubeId) {
        return {
          youtubeId: match.track.youtubeId,
          confidence: match.confidence,
          verified: match.confidence >= 0.85,
          title: match.track.title,
          artist: match.track.artist,
          duration: match.track.duration || 180,
        };
      }
    } catch {
      // Failed to match
    }

    return null;
  }
}

export const youtubeVideoMapper = new YouTubeVideoMapper();

