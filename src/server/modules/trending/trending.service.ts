import { youtubeProvider } from '@/server/providers/youtube.adapter';
import { Track } from '@/types';
import { cleanSongTitle, cleanNorm } from '@/server/providers/youtube.adapter';

interface CachedTrending {
  timestamp: number;
  data: {
    hero: Track | null;
    quickAccess: Track[];
    trendingIndia: Track[];
    latestHindi: Track[];
    trendingSouth: Track[];
    punjabiDesiHipHop: Track[];
    acousticSoul: Track[];
  };
}

let MEMORY_CACHE: CachedTrending | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache with background refresh

// Fallback high-quality curated tracks if network search fails
const FALLBACK_TRENDING_INDIA: Track[] = [
  {
    id: 'yt-BddP6PYo2gs',
    youtubeId: 'BddP6PYo2gs',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmāstra',
    duration: 268,
    thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 99,
  },
  {
    id: 'yt-LK7-_dgAVQE',
    youtubeId: 'LK7-_dgAVQE',
    title: 'Tauba Tauba',
    artist: 'Karan Aujla',
    album: 'Bad Newz',
    duration: 207,
    thumbnail: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 98,
  },
  {
    id: 'yt-NXM7BC5EOrg',
    youtubeId: 'NXM7BC5EOrg',
    title: 'Illuminati',
    artist: 'Sushin Shyam, Dabzee',
    album: 'Aavesham',
    duration: 204,
    thumbnail: 'https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 97,
  },
  {
    id: 'yt-5L9WN5SJYlY',
    youtubeId: '5L9WN5SJYlY',
    title: 'Hukum - Thalaivar Alappara',
    artist: 'Anirudh Ravichander',
    album: 'Jailer',
    duration: 207,
    thumbnail: 'https://i.ytimg.com/vi/5L9WN5SJYlY/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 97,
  },
  {
    id: 'yt-VAdGW7QDJiU',
    youtubeId: 'VAdGW7QDJiU',
    title: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao',
    album: 'Jawan',
    duration: 200,
    thumbnail: 'https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 96,
  },
  {
    id: 'yt-VU23OPQ1Pmc',
    youtubeId: 'VU23OPQ1Pmc',
    title: 'Katchi Sera',
    artist: 'Sai Abhyankkar',
    album: 'Katchi Sera',
    duration: 184,
    thumbnail: 'https://i.ytimg.com/vi/VU23OPQ1Pmc/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 95,
  },
  {
    id: 'yt-9UmoVnBSm5k',
    youtubeId: '9UmoVnBSm5k',
    title: 'Pehle Bhi Main',
    artist: 'Vishal Mishra',
    album: 'Animal',
    duration: 250,
    thumbnail: 'https://i.ytimg.com/vi/9UmoVnBSm5k/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 94,
  },
  {
    id: 'yt-3wDiqlTNlfQ',
    youtubeId: '3wDiqlTNlfQ',
    title: 'Naa Ready',
    artist: 'Thalapathy Vijay, Anirudh',
    album: 'Leo',
    duration: 248,
    thumbnail: 'https://i.ytimg.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 94,
  },
  {
    id: 'yt-W6-O00alJUo',
    youtubeId: 'W6-O00alJUo',
    title: 'Kuthanthram',
    artist: 'Sushin Shyam, Vedan',
    album: 'Manjummel Boys',
    duration: 215,
    thumbnail: 'https://i.ytimg.com/vi/W6-O00alJUo/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 93,
  },
  {
    id: 'yt-gJLVTKhTnog',
    youtubeId: 'gJLVTKhTnog',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: 'Husn',
    duration: 218,
    thumbnail: 'https://i.ytimg.com/vi/gJLVTKhTnog/hqdefault.jpg',
    source: 'youtube',
    aiMatch: 93,
  },
];

export class TrendingMusicService {
  /**
   * Deduplicates track arrays strictly by normalized artist and clean title.
   */
  private deduplicate(tracks: Track[]): Track[] {
    const seenIds = new Set<string>();
    const seenSongKeys = new Set<string>();
    const result: Track[] = [];

    for (const t of tracks) {
      const cleanTitle = cleanSongTitle(t.title);
      const songKey = `${cleanNorm(t.artist)}:::${cleanNorm(cleanTitle)}`;

      if (seenIds.has(t.youtubeId) || seenSongKeys.has(songKey)) {
        continue;
      }
      seenIds.add(t.youtubeId);
      seenSongKeys.add(songKey);

      result.push({
        ...t,
        title: cleanTitle,
        source: 'youtube',
      });
    }

    return result;
  }

  /**
   * Fetches dynamic trending Indian music directly from live YouTube provider.
   */
  public async getDynamicHomepageRails(): Promise<CachedTrending['data']> {
    const now = Date.now();

    // If cache is fresh, return immediately
    if (MEMORY_CACHE && now - MEMORY_CACHE.timestamp < CACHE_TTL_MS) {
      return MEMORY_CACHE.data;
    }

    try {
      // Fetch live trending categories in parallel
      const [
        trendingIndiaRaw,
        latestHindiRaw,
        tamilHitsRaw,
        malayalamHitsRaw,
        punjabiHitsRaw,
        acousticRaw,
      ] = await Promise.all([
        youtubeProvider.search('trending indian hit songs this week', 20).catch(() => []),
        youtubeProvider.search('latest bollywood hindi songs 2024 2025', 20).catch(() => []),
        youtubeProvider.search('latest tamil songs 2024 2025', 18).catch(() => []),
        youtubeProvider.search('latest malayalam songs 2024 2025', 18).catch(() => []),
        youtubeProvider.search('latest punjabi songs 2024 2025', 18).catch(() => []),
        youtubeProvider.search('latest indian acoustic indie songs', 18).catch(() => []),
      ]);

      const trendingIndia = this.deduplicate(
        trendingIndiaRaw.length >= 6 ? trendingIndiaRaw : [...trendingIndiaRaw, ...FALLBACK_TRENDING_INDIA]
      );

      const latestHindi = this.deduplicate(
        latestHindiRaw.length >= 6
          ? latestHindiRaw
          : [
              ...latestHindiRaw,
              ...FALLBACK_TRENDING_INDIA.filter((t) =>
                ['Kesariya', 'Tauba Tauba', 'Chaleya', 'Pehle Bhi Main', 'Husn'].includes(t.title)
              ),
            ]
      );

      // Merge Tamil and Malayalam for South Wave rail
      const trendingSouth = this.deduplicate([...tamilHitsRaw, ...malayalamHitsRaw]);
      const southFinal =
        trendingSouth.length >= 6
          ? trendingSouth
          : this.deduplicate([
              ...trendingSouth,
              ...FALLBACK_TRENDING_INDIA.filter((t) =>
                ['Illuminati', 'Hukum - Thalaivar Alappara', 'Katchi Sera', 'Naa Ready', 'Kuthanthram'].includes(t.title)
              ),
            ]);

      const punjabiDesiHipHop = this.deduplicate(punjabiHitsRaw);
      const acousticSoul = this.deduplicate(acousticRaw);

      // Hero Spotlight track (highest trending track)
      const hero = trendingIndia[0] || latestHindi[0] || FALLBACK_TRENDING_INDIA[0];

      // Quick Access Picks (top 6 picks blending across categories)
      const quickPicks = this.deduplicate([
        ...trendingIndia.slice(0, 3),
        ...southFinal.slice(0, 3),
        ...latestHindi.slice(0, 3),
      ]).slice(0, 6);

      const data = {
        hero,
        quickAccess: quickPicks,
        trendingIndia: trendingIndia.slice(0, 18),
        latestHindi: latestHindi.slice(0, 18),
        trendingSouth: southFinal.slice(0, 18),
        punjabiDesiHipHop: punjabiDesiHipHop.slice(0, 18),
        acousticSoul: acousticSoul.slice(0, 18),
      };

      MEMORY_CACHE = {
        timestamp: now,
        data,
      };

      return data;
    } catch (err) {
      console.warn('[TrendingService] Failed to scrape live trending; using calibrated fallback:', err);
      const fallbackHero = FALLBACK_TRENDING_INDIA[0];
      return {
        hero: fallbackHero,
        quickAccess: FALLBACK_TRENDING_INDIA.slice(0, 6),
        trendingIndia: FALLBACK_TRENDING_INDIA,
        latestHindi: FALLBACK_TRENDING_INDIA.slice(0, 6),
        trendingSouth: FALLBACK_TRENDING_INDIA.slice(2, 8),
        punjabiDesiHipHop: FALLBACK_TRENDING_INDIA.slice(1, 5),
        acousticSoul: FALLBACK_TRENDING_INDIA.slice(6, 10),
      };
    }
  }
}

export const trendingMusicService = new TrendingMusicService();

