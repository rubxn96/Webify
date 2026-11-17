export interface MusicBrainzRecording {
  id: string;
  title: string;
  artist: string;
  isrc?: string;
  releaseDate?: Date;
  score: number;
}

export class MusicBrainzService {
  private lastRequestTime = 0;
  private readonly minIntervalMs = 1100; // Rate limit guard: max 1 req / 1.1s
  private readonly userAgent = 'WebifyMusic/2.0 (contact@webify.audio)';

  public async lookupRecording(
    title: string,
    artist: string
  ): Promise<MusicBrainzRecording | null> {
    const now = Date.now();
    const wait = Math.max(0, this.minIntervalMs - (now - this.lastRequestTime));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestTime = Date.now();

    try {
      const query = `recording:"${title.replace(/"/g, '')}" AND artist:"${artist.replace(
        /"/g,
        ''
      )}"`;
      const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(
        query
      )}&limit=3&fmt=json`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const recordings = data?.recordings;

      if (Array.isArray(recordings) && recordings.length > 0) {
        const top = recordings[0];
        const isrc = Array.isArray(top.isrcs) && top.isrcs.length > 0 ? top.isrcs[0] : undefined;
        let releaseDate: Date | undefined;
        if (top['first-release-date']) {
          const parsed = new Date(top['first-release-date']);
          if (!isNaN(parsed.getTime())) releaseDate = parsed;
        }

        return {
          id: top.id,
          title: top.title,
          artist:
            top['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(', ') || artist,
          isrc,
          releaseDate,
          score: top.score || 100,
        };
      }
    } catch {
      // Graceful fallback
    }

    return null;
  }
}

export const musicBrainzService = new MusicBrainzService();

