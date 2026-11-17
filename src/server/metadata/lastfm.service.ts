export interface LastFmTag {
  name: string;
  count: number;
}

export class LastFmService {
  private readonly apiKey = process.env.LASTFM_API_KEY;
  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  /**
   * Fetches similar songs and tags from Last.fm API with resilient fallback
   */
  public async getSimilarTracks(
    artist: string,
    track: string,
    limit: number = 8
  ): Promise<{ title: string; artist: string; match: number }[]> {
    if (!this.apiKey) {
      return this.getLocalSimilarFallback(artist, track);
    }

    try {
      const url = `${this.baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(
        artist
      )}&track=${encodeURIComponent(track)}&api_key=${this.apiKey}&format=json&limit=${limit}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return this.getLocalSimilarFallback(artist, track);

      const data = await res.json();
      const trackList = data?.similartracks?.track;

      if (Array.isArray(trackList)) {
        return trackList.map((t: any) => ({
          title: t.name,
          artist: t.artist?.name || t.artist,
          match: parseFloat(t.match) || 0.8,
        }));
      }
    } catch {
      // Fallback
    }

    return this.getLocalSimilarFallback(artist, track);
  }

  /**
   * Fetches top tags for an artist or track
   */
  public async getTags(artist: string, track?: string): Promise<string[]> {
    if (!this.apiKey) {
      return this.inferTags(artist, track);
    }

    try {
      const method = track ? 'track.gettoptags' : 'artist.gettoptags';
      const trackParam = track ? `&track=${encodeURIComponent(track)}` : '';
      const url = `${this.baseUrl}?method=${method}&artist=${encodeURIComponent(
        artist
      )}${trackParam}&api_key=${this.apiKey}&format=json`;

      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return this.inferTags(artist, track);

      const data = await res.json();
      const tags = data?.toptags?.tag;

      if (Array.isArray(tags)) {
        return tags
          .slice(0, 6)
          .map((t: any) => (typeof t === 'string' ? t : t.name).toLowerCase())
          .filter((t: string) => t && !['seen live', 'favorites'].includes(t));
      }
    } catch {
      // Fallback
    }

    return this.inferTags(artist, track);
  }

  private inferTags(artist: string, track?: string): string[] {
    const text = `${artist} ${track || ''}`.toLowerCase();
    const tags: string[] = [];

    if (text.includes('arijit') || text.includes('pritam') || text.includes('shreya')) {
      tags.push('romantic', 'bollywood', 'melodic', 'soulful');
    } else if (text.includes('anirudh') || text.includes('santhosh') || text.includes('yuvan')) {
      tags.push('kollywood', 'high-energy', 'mass', 'electronic');
    } else if (text.includes('sushin') || text.includes('rex') || text.includes('dabzee')) {
      tags.push('mollywood', 'indie', 'experimental', 'malayalam hip-hop');
    } else if (text.includes('sid sriram')) {
      tags.push('carnatic fusion', 'soulful', 'melodic', 'contemporary');
    } else if (text.includes('karan aujla') || text.includes('diljit') || text.includes('ap dhillon')) {
      tags.push('punjabi pop', 'desi hip hop', 'party', 'bass');
    } else if (text.includes('prateek kuhad') || text.includes('anuv jain') || text.includes('local train')) {
      tags.push('indian indie', 'acoustic', 'chill', 'heartwarming');
    } else {
      tags.push('indian pop', 'contemporary', 'chartbuster');
    }

    return tags;
  }

  private getLocalSimilarFallback(
    artist: string,
    track: string
  ): { title: string; artist: string; match: number }[] {
    return [];
  }
}

export const lastFmService = new LastFmService();

