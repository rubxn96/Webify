import { IndianLanguage, RawSongMetadata } from './types';
import { cleanSongTitle } from '@/lib/youtube/songFilter';

export class JioSaavnService {
  private readonly timeoutMs = 3500;

  /**
   * Search songs via JioSaavn public endpoints with multi-mirror failover
   */
  public async searchSongs(query: string, limit: number = 10): Promise<RawSongMetadata[]> {
    if (!query.trim()) return [];

    // Mirror 1: saavn.dev modern REST mirror
    try {
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: { 'User-Agent': 'WebifyMusic/2.0' },
          signal: AbortSignal.timeout(this.timeoutMs),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const items = json?.data?.results || json?.results || [];
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item: any) => this.normalizeSaavnDevItem(item)).filter(Boolean);
        }
      }
    } catch {
      // Continue to next mirror
    }

    // Mirror 2: Official JioSaavn search endpoint
    try {
      const res = await fetch(
        `https://www.jiosaavn.com/api.php?__call=search.getSongResults&q=${encodeURIComponent(
          query
        )}&p=1&n=${limit}&_format=json&_marker=0&ctx=web6dot0`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        }
      );

      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        const results = json?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          return results.map((r: any) => this.normalizeOfficialSaavnItem(r)).filter(Boolean);
        }
      }
    } catch {
      // Silent catch; external provider unavailable
    }

    return [];
  }

  /**
   * Discovers top songs in a specific Indian language
   */
  public async discoverByLanguage(
    language: IndianLanguage,
    limit: number = 15
  ): Promise<RawSongMetadata[]> {
    const languageQueries: Record<IndianLanguage, string[]> = {
      malayalam: ['latest malayalam hits', 'top malayalam songs 2024', 'malayalam melodies'],
      tamil: ['latest tamil hits', 'kollywood top songs', 'tamil melodies anirudh'],
      telugu: ['latest telugu hits', 'tollywood top songs', 'telugu melodies'],
      kannada: ['latest kannada hits', 'sandalwood top songs', 'kannada melodies'],
      hindi: ['latest bollywood hits', 'trending hindi songs 2024', 'arijit singh hits'],
      punjabi: ['latest punjabi hits', 'top punjabi songs', 'punjabi pop hits'],
      bengali: ['latest bengali hits', 'bengali top songs', 'bengali modern melodies'],
      marathi: ['latest marathi hits', 'marathi top songs', 'marathi melodies'],
    };

    const queries = languageQueries[language] || [`latest ${language} songs`];
    const results: RawSongMetadata[] = [];
    const seenTitles = new Set<string>();

    for (const q of queries) {
      const batch = await this.searchSongs(q, Math.ceil(limit / queries.length) + 2);
      for (const track of batch) {
        const key = `${track.title.toLowerCase()}:::${track.artist.toLowerCase()}`;
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          track.language = language;
          results.push(track);
        }
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    return results;
  }

  private normalizeSaavnDevItem(item: any): RawSongMetadata {
    const rawTitle = item.name || item.title || 'Unknown Title';
    const cleanTitle = cleanSongTitle(rawTitle);

    const primaryArtists = Array.isArray(item.artists?.primary)
      ? item.artists.primary.map((a: any) => a.name)
      : typeof item.primaryArtists === 'string'
      ? item.primaryArtists.split(',').map((s: string) => s.trim())
      : [];

    const featuredArtists = Array.isArray(item.artists?.featured)
      ? item.artists.featured.map((a: any) => a.name)
      : [];

    const artist =
      primaryArtists.join(', ') ||
      item.artist ||
      item.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') ||
      'Unknown Artist';

    let thumbnail = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
    if (Array.isArray(item.image)) {
      thumbnail = item.image[item.image.length - 1]?.url || item.image[0]?.url || thumbnail;
    } else if (typeof item.image === 'string') {
      thumbnail = item.image;
    }

    const duration = parseInt(item.duration, 10) || 180;
    const playCount = parseInt(item.playCount, 10) || 1000;
    const popularity = Math.min(100, Math.max(30, Math.round(Math.log10(playCount) * 15)));

    const rawLang = (item.language || '').toLowerCase().trim();
    const language = this.mapLanguage(rawLang);

    const tags: string[] = [];
    if (language) tags.push(language);
    if (item.label) tags.push(item.label.toLowerCase());
    if (item.album?.name) tags.push(item.album.name.toLowerCase());

    let releaseDate: Date | undefined;
    if (item.releaseDate) {
      const parsed = new Date(item.releaseDate);
      if (!isNaN(parsed.getTime())) releaseDate = parsed;
    } else if (item.year) {
      releaseDate = new Date(`${item.year}-01-01`);
    }

    return {
      title: cleanTitle || rawTitle,
      artist,
      primaryArtists,
      featuredArtists,
      album: item.album?.name || item.album || undefined,
      releaseDate,
      releaseYear: item.year ? parseInt(item.year, 10) : undefined,
      language,
      genre: this.inferGenre(item, language),
      tags,
      duration,
      popularity,
      thumbnail,
      jioSaavnId: item.id || undefined,
    };
  }

  private normalizeOfficialSaavnItem(r: any): RawSongMetadata {
    const rawTitle = (r.song || r.title || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const cleanTitle = cleanSongTitle(rawTitle);

    const primaryArtists = (r.primary_artists || r.singers || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const artist =
      primaryArtists.join(', ') ||
      (r.artist || r.music || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&') ||
      'Unknown Artist';

    const thumbnail =
      (r.image || '').replace('150x150', '500x500') ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

    const duration = parseInt(r.duration, 10) || 180;
    const playCount = parseInt(r.play_count, 10) || 1000;
    const popularity = Math.min(100, Math.max(30, Math.round(Math.log10(playCount) * 15)));

    const rawLang = (r.language || '').toLowerCase().trim();
    const language = this.mapLanguage(rawLang);

    return {
      title: cleanTitle || rawTitle,
      artist,
      primaryArtists,
      featuredArtists: [],
      album: r.album ? r.album.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : undefined,
      releaseYear: r.year ? parseInt(r.year, 10) : undefined,
      language,
      genre: this.inferGenre(r, language),
      tags: [language, ...(r.language ? [r.language] : [])].filter(Boolean),
      duration,
      popularity,
      thumbnail,
      jioSaavnId: r.id || undefined,
    };
  }

  private mapLanguage(lang: string): IndianLanguage | string {
    const lower = lang.toLowerCase();
    if (lower.includes('malayalam')) return 'malayalam';
    if (lower.includes('tamil')) return 'tamil';
    if (lower.includes('telugu')) return 'telugu';
    if (lower.includes('kannada')) return 'kannada';
    if (lower.includes('hindi')) return 'hindi';
    if (lower.includes('punjabi')) return 'punjabi';
    if (lower.includes('bengali') || lower.includes('bangla')) return 'bengali';
    if (lower.includes('marathi')) return 'marathi';
    return lower || 'hindi';
  }

  private inferGenre(item: any, language?: string): string {
    const text = `${item.title || item.song || ''} ${item.album?.name || item.album || ''} ${
      item.subtitle || ''
    } ${item.primary_artists || ''}`.toLowerCase();

    if (text.includes('acoustic') || text.includes('unplugged')) return 'Acoustic';
    if (text.includes('hip hop') || text.includes('rap') || text.includes('trap')) return 'Hip-Hop';
    if (text.includes('sufi') || text.includes('qawwali') || text.includes('ghazal')) return 'Sufi';
    if (text.includes('indie') || text.includes('independent')) return 'Indie';
    if (text.includes('classical') || text.includes('raga')) return 'Classical';
    if (text.includes('folk')) return 'Folk';
    if (text.includes('party') || text.includes('remix') || text.includes('dance')) return 'Dance';

    if (language === 'hindi') return 'Bollywood';
    if (language === 'tamil') return 'Kollywood';
    if (language === 'telugu') return 'Tollywood';
    if (language === 'malayalam') return 'Mollywood';
    if (language === 'punjabi') return 'Punjabi Pop';

    return 'Pop';
  }
}

export const jioSaavnService = new JioSaavnService();

