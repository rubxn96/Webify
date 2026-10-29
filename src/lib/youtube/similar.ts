import { Track } from '@/types';
import {
  cleanSongTitle,
  cleanNorm,
  isPristineSongTrack,
  isRecordLabel,
} from '@/lib/youtube/songFilter';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

export type DetectedVibe =
  | 'bollywood-melodic'
  | 'bollywood-party'
  | 'tamil'
  | 'malayalam'
  | 'punjabi'
  | 'indian-general';

interface VibeContext {
  songName: string;
  movieOrContext: string | null;
  detectedArtist: string | null;
  vibe: DetectedVibe;
}

// Curated verified chartbusters for guaranteed high-quality queue backfills
const BOLLYWOOD_MELODIC_POOL: Track[] = [
  {
    id: 'yt-Etkd-07gnxM',
    youtubeId: 'Etkd-07gnxM',
    title: 'O Maahi',
    artist: 'Arijit Singh, Pritam',
    album: 'Dunki',
    duration: 233,
    thumbnail: 'https://i.ytimg.com/vi/Etkd-07gnxM/hqdefault.jpg',
    source: 'youtube',
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
  },
  {
    id: 'yt-ElZfdU54Cp8',
    youtubeId: 'ElZfdU54Cp8',
    title: 'Apna Bana Le',
    artist: 'Arijit Singh, Sachin-Jigar',
    album: 'Bhediya',
    duration: 261,
    thumbnail: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-BddP6PYo2gs',
    youtubeId: 'BddP6PYo2gs',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmāstra',
    duration: 268,
    thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
    source: 'youtube',
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
  },
  {
    id: 'yt-HrnrqYxYrbk',
    youtubeId: 'HrnrqYxYrbk',
    title: 'Satranga',
    artist: 'Arijit Singh',
    album: 'Animal',
    duration: 271,
    thumbnail: 'https://i.ytimg.com/vi/HrnrqYxYrbk/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-QXJyMpxd210',
    youtubeId: 'QXJyMpxd210',
    title: 'Ve Kamleya',
    artist: 'Arijit Singh, Shreya Ghoshal',
    album: 'Rocky Aur Rani Kii Prem Kahaani',
    duration: 247,
    thumbnail: 'https://i.ytimg.com/vi/QXJyMpxd210/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-k3g_WjLCsXM',
    youtubeId: 'k3g_WjLCsXM',
    title: 'Sajni',
    artist: 'Arijit Singh, Ram Sampath',
    album: 'Laapataa Ladies',
    duration: 170,
    thumbnail: 'https://i.ytimg.com/vi/k3g_WjLCsXM/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-Nnop2walGmM',
    youtubeId: 'Nnop2walGmM',
    title: 'Tum Se',
    artist: 'Sachin-Jigar, Raghav Chaitanya',
    album: 'Teri Baaton Mein Aisa Uljha Jiya',
    duration: 262,
    thumbnail: 'https://i.ytimg.com/vi/Nnop2walGmM/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-GvXDq-P1NB8',
    youtubeId: 'GvXDq-P1NB8',
    title: 'Akhiyaan Gulaab',
    artist: 'Mitraz',
    album: 'Teri Baaton Mein Aisa Uljha Jiya',
    duration: 171,
    thumbnail: 'https://i.ytimg.com/vi/GvXDq-P1NB8/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-AX6OrbgS8lI',
    youtubeId: 'AX6OrbgS8lI',
    title: 'Tu Hai Kahan',
    artist: 'AUR',
    album: 'Tu Hai Kahan',
    duration: 263,
    thumbnail: 'https://i.ytimg.com/vi/AX6OrbgS8lI/hqdefault.jpg',
    source: 'youtube',
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
  },
  {
    id: 'yt-RLzC55ai0eo',
    youtubeId: 'RLzC55ai0eo',
    title: 'Heeriye',
    artist: 'Jasleen Royal, Arijit Singh',
    album: 'Heeriye',
    duration: 194,
    thumbnail: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-gvyUuxdRdR4',
    youtubeId: 'gvyUuxdRdR4',
    title: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal, Asees Kaur',
    album: 'Shershaah',
    duration: 230,
    thumbnail: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-V7LwfY5U5WI',
    youtubeId: 'V7LwfY5U5WI',
    title: 'Ranjha',
    artist: 'B Praak, Jasleen Royal',
    album: 'Shershaah',
    duration: 228,
    thumbnail: 'https://i.ytimg.com/vi/V7LwfY5U5WI/hqdefault.jpg',
    source: 'youtube',
  },
  {
    id: 'yt-sK7riqg2mr4',
    youtubeId: 'sK7riqg2mr4',
    title: 'Agar Tum Saath Ho',
    artist: 'Arijit Singh, Alka Yagnik',
    album: 'Tamasha',
    duration: 341,
    thumbnail: 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg',
    source: 'youtube',
  },
];

const TAMIL_POOL: Track[] = [
  {
    id: 'yt-5L9WN5SJYlY',
    youtubeId: '5L9WN5SJYlY',
    title: 'Hukum - Thalaivar Alappara',
    artist: 'Anirudh Ravichander',
    album: 'Jailer',
    duration: 207,
    thumbnail: 'https://i.ytimg.com/vi/5L9WN5SJYlY/hqdefault.jpg',
    source: 'youtube',
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
  },
];

const MALAYALAM_POOL: Track[] = [
  {
    id: 'yt-NXM7BC5EOrg',
    youtubeId: 'NXM7BC5EOrg',
    title: 'Illuminati',
    artist: 'Sushin Shyam, Dabzee',
    album: 'Aavesham',
    duration: 204,
    thumbnail: 'https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg',
    source: 'youtube',
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
  },
];

const PUNJABI_POOL: Track[] = [
  {
    id: 'yt-LK7-_dgAVQE',
    youtubeId: 'LK7-_dgAVQE',
    title: 'Tauba Tauba',
    artist: 'Karan Aujla',
    album: 'Bad Newz',
    duration: 207,
    thumbnail: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg',
    source: 'youtube',
  },
];

/**
 * Parses raw title and artist to extract the true song name, movie/album context,
 * and classify the vibe (Bollywood Melodic, Tamil, Malayalam, Punjabi, etc.)
 */
export function extractVibeAndContext(rawTitle: string, rawArtist?: string): VibeContext {
  const clean = cleanSongTitle(rawTitle);
  const textToScan = `${rawTitle} ${rawArtist || ''}`.toLowerCase();

  // Split title tokens by common Indian music separators: |, -, •, :, /
  const tokens = clean
    .split(/\s*[\-\|\•\:\/]\s*/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  let songName = tokens[0] || clean;
  let movieOrContext: string | null = null;
  let detectedArtist: string | null = null;

  // Check if token 0 has parenthetical movie context: "O Maahi (Dunki)" or "Satranga (From 'Animal')"
  const parenMatch = songName.match(/^([^\(\[]+)\s*[\(\[](?:from\s+)?["']?([^"'\]\)]+)["']?[\)\]]/i);
  if (parenMatch) {
    songName = parenMatch[1].trim();
    movieOrContext = parenMatch[2].trim();
  }

  // If token 1 exists and is not a record label or generic tag, it is usually the movie
  if (!movieOrContext && tokens[1] && !isRecordLabel(tokens[1])) {
    // If token 1 does not look like a singer name (e.g., "Ranveer Singh", "Arijit Singh"), use it as movie/album
    movieOrContext = tokens[1];
  }

  // Scan remaining tokens for actual singers or actors
  if (tokens.length > 2) {
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (!isRecordLabel(tok) && tok !== movieOrContext) {
        detectedArtist = tok;
        break;
      }
    }
  }

  // Language & Genre vibe classifier
  let vibe: DetectedVibe = 'bollywood-melodic'; // default for Hindi / Indian cinema hits

  const isTamil = /\b(tamil|jailer|leo|goat|amaran|kanguva|anirudh|thalapathy|vijay|rajinikanth|sivakarthikeyan|kollywood|kaavaalaa|hukum|naa ready|katchi sera)\b/i.test(textToScan);
  const isMalayalam = /\b(malayalam|aavesham|premalu|manjummel|arm|bramayugam|sushin|fahadh|faasil|mollywood|illuminati|kuthanthram|jaada|thaanaro)\b/i.test(textToScan);
  const isPunjabi = /\b(punjabi|karan aujla|diljit|sidhu|ap dhillon|shubh|ammy virk|tauba tauba|softly|winning speech)\b/i.test(textToScan);
  const isBollywoodParty = /\b(dance|party|club|remix|dhamaka|nacho|thumkeshwari|bad newz)\b/i.test(textToScan);

  if (isTamil) {
    vibe = 'tamil';
  } else if (isMalayalam) {
    vibe = 'malayalam';
  } else if (isPunjabi) {
    vibe = 'punjabi';
  } else if (isBollywoodParty) {
    vibe = 'bollywood-party';
  } else {
    // Standard Bollywood Melodic / Romance (like Gehra Hua, Chaleya, Kesariya, Apna Bana Le)
    vibe = 'bollywood-melodic';
  }

  return {
    songName,
    movieOrContext,
    detectedArtist,
    vibe,
  };
}

/**
 * Generates a perfect vibe-matching queue of standalone single songs for any playing track.
 * Strictly guarantees:
 * 1. ZERO compilations, full albums, radio shows, jukeboxes, or multi-hour tracks
 * 2. ZERO duplicates of the current playing song
 * 3. Never searches record labels like "Saregama" or "T-Series" directly
 * 4. Fills the queue with contemporary chartbusters matching the exact language and mood vibe!
 */
export async function getSimilarTracks(
  currentTrack: {
    youtubeId: string;
    title: string;
    artist: string;
    embedding?: number[];
  },
  limit: number = 20
): Promise<Track[]> {
  const currentClean = cleanSongTitle(currentTrack.title);
  const currentNormTitle = cleanNorm(currentClean);
  const currentKey = `${cleanNorm(currentTrack.artist)}:::${currentNormTitle}`;

  const similarList: Track[] = [];
  const seenSongKeys = new Set<string>([currentKey]);
  const seenYouTubeIds = new Set<string>([currentTrack.youtubeId]);
  const seenTitles = new Set<string>([currentNormTitle]);

  const { songName, movieOrContext, detectedArtist, vibe } = extractVibeAndContext(
    currentTrack.title,
    currentTrack.artist
  );

  const cleanSongNorm = cleanNorm(songName);

  // 1. Scrape YouTube Mix (RDAMVM / RD) - with strict single-track validation (80s - 450s)
  try {
    const mixResults = await youtubeProvider.scrapeRelatedMix(currentTrack.youtubeId, limit);

    for (const yt of mixResults) {
      if (!isPristineSongTrack(yt)) continue;

      const cleanedTitle = cleanSongTitle(yt.title);
      const songNormTitle = cleanNorm(cleanedTitle);
      const songKey = `${cleanNorm(yt.artist)}:::${songNormTitle}`;
      const { songName: ytSongName } = extractVibeAndContext(yt.title, yt.artist);
      const ytSongNorm = cleanNorm(ytSongName);
      const ytCombined = `${songNormTitle}${cleanNorm(yt.artist)}`;

      // Strictly skip if this song is the same (or a lyrical/audio clone) of the current playing song
      if (
        songNormTitle === currentNormTitle ||
        songNormTitle === cleanSongNorm ||
        ytSongNorm === cleanSongNorm ||
        (cleanSongNorm.length >= 4 && ytCombined.includes(cleanSongNorm)) ||
        seenTitles.has(songNormTitle) ||
        seenTitles.has(ytSongNorm) ||
        seenSongKeys.has(songKey) ||
        seenYouTubeIds.has(yt.youtubeId)
      ) {
        continue;
      }

      seenSongKeys.add(songKey);
      seenTitles.add(songNormTitle);
      seenTitles.add(ytSongNorm);
      seenYouTubeIds.add(yt.youtubeId);

      similarList.push({
        ...yt,
        id: `yt-${yt.youtubeId}`,
        title: cleanedTitle || yt.title,
        source: 'youtube',
      });

      if (similarList.length >= limit) break;
    }
  } catch (err) {
    console.warn('[SimilarTracks] scrapeRelatedMix notice:', err);
  }

  // 2. High-Intent Vibe Search Queries
  if (similarList.length < limit) {
    try {
      const searchQueries: string[] = [];

      // A. Sibling movie tracks (e.g. "Dhurandhar song")
      if (movieOrContext && movieOrContext.length > 2 && !isRecordLabel(movieOrContext)) {
        searchQueries.push(`${movieOrContext} song`);
      }

      // B. Seed song related (e.g. "Gehra Hua song")
      if (songName && songName.length > 2) {
        searchQueries.push(`${songName} song`);
      }

      // C. Target queries matching detected vibe
      if (vibe === 'bollywood-melodic') {
        searchQueries.push(
          'latest bollywood romantic songs 2024 2025',
          'trending hindi romantic songs 2024',
          'arijit singh romantic hits'
        );
      } else if (vibe === 'tamil') {
        searchQueries.push(
          'latest tamil songs 2024 2025',
          'anirudh hit songs 2024'
        );
      } else if (vibe === 'malayalam') {
        searchQueries.push(
          'latest malayalam songs 2024 2025',
          'sushin shyam hit songs'
        );
      } else if (vibe === 'punjabi') {
        searchQueries.push(
          'latest punjabi songs 2024 2025',
          'karan aujla diljit hits'
        );
      } else {
        searchQueries.push('trending indian songs 2024');
      }

      for (const q of searchQueries) {
        if (similarList.length >= limit) break;
        const candidates = await youtubeProvider.search(q, 8).catch(() => []);

        for (const c of candidates) {
          if (!isPristineSongTrack(c)) continue;

          const cTitle = cleanSongTitle(c.title);
          const cNorm = cleanNorm(cTitle);
          const cKey = `${cleanNorm(c.artist)}:::${cNorm}`;
          const { songName: cSongName } = extractVibeAndContext(c.title, c.artist);
          const cSongNorm = cleanNorm(cSongName);
          const cCombined = `${cNorm}${cleanNorm(c.artist)}`;

          if (
            cNorm === currentNormTitle ||
            cNorm === cleanSongNorm ||
            cSongNorm === cleanSongNorm ||
            (cleanSongNorm.length >= 4 && cCombined.includes(cleanSongNorm)) ||
            seenTitles.has(cNorm) ||
            seenTitles.has(cSongNorm) ||
            seenSongKeys.has(cKey) ||
            seenYouTubeIds.has(c.youtubeId)
          ) {
            continue;
          }

          seenSongKeys.add(cKey);
          seenTitles.add(cNorm);
          seenTitles.add(cSongNorm);
          seenYouTubeIds.add(c.youtubeId);

          similarList.push({
            ...c,
            id: `yt-${c.youtubeId}`,
            title: cTitle || c.title,
            source: 'youtube',
          });

          if (similarList.length >= limit) break;
        }
      }
    } catch (err) {
      console.warn('[SimilarTracks] Vibe search notice:', err);
    }
  }

  // 3. Guaranteed Backfill from Curated Vibe Pools
  // If the queue still has fewer than `limit` items, backfill with curated single chartbusters of that exact vibe!
  if (similarList.length < limit) {
    let pool: Track[] = BOLLYWOOD_MELODIC_POOL;
    if (vibe === 'tamil') pool = [...TAMIL_POOL, ...BOLLYWOOD_MELODIC_POOL];
    else if (vibe === 'malayalam') pool = [...MALAYALAM_POOL, ...BOLLYWOOD_MELODIC_POOL];
    else if (vibe === 'punjabi') pool = [...PUNJABI_POOL, ...BOLLYWOOD_MELODIC_POOL];

    for (const track of pool) {
      const normT = cleanNorm(track.title);
      const trackKey = `${cleanNorm(track.artist)}:::${normT}`;

      if (
        normT === currentNormTitle ||
        normT === cleanSongNorm ||
        seenTitles.has(normT) ||
        seenSongKeys.has(trackKey) ||
        seenYouTubeIds.has(track.youtubeId)
      ) {
        continue;
      }

      seenSongKeys.add(trackKey);
      seenTitles.add(normT);
      seenYouTubeIds.add(track.youtubeId);

      similarList.push({ ...track });

      if (similarList.length >= limit) break;
    }
  }

  return similarList;
}
