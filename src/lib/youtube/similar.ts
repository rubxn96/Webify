import { Track } from '@/types';
import { cleanSongTitle, normalizeKey } from './search';
import { youtubeProvider, cleanNorm } from '@/server/providers/youtube.adapter';

/**
 * Generates true related songs for any playing track using YouTube Mix (RDAMVM)
 * and live related artist radio, completely independent of any static database catalog.
 * Strictly filters out duplicate versions, lyrical clones, or re-uploads of the current song!
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

  // 1. Scrape live YouTube Mix (RDAMVM / RD) for the seed track
  try {
    const mixResults = await youtubeProvider.scrapeRelatedMix(currentTrack.youtubeId, limit);

    for (const yt of mixResults) {
      const cleanedTitle = cleanSongTitle(yt.title);
      const songNormTitle = cleanNorm(cleanedTitle);
      const songKey = `${cleanNorm(yt.artist)}:::${songNormTitle}`;

      // Strictly skip if this song is the SAME as the current playing song
      if (
        songNormTitle === currentNormTitle ||
        seenSongKeys.has(songKey) ||
        seenYouTubeIds.has(yt.youtubeId)
      ) {
        continue;
      }

      seenSongKeys.add(songKey);
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

  // 2. If the mix yielded fewer tracks, augment with live artist radio mix
  if (similarList.length < limit) {
    try {
      const cleanArtist = currentTrack.artist.replace(/Topic|VEVO|Official|Records|Music/gi, '').trim();
      const radioQueries = [
        `${cleanArtist} hit songs`,
        `${currentClean} similar songs`,
      ];

      for (const q of radioQueries) {
        if (similarList.length >= limit) break;
        const candidates = await youtubeProvider.search(q, 10).catch(() => []);

        for (const c of candidates) {
          const cTitle = cleanSongTitle(c.title);
          const cNorm = cleanNorm(cTitle);
          const cKey = `${cleanNorm(c.artist)}:::${cNorm}`;

          if (
            cNorm === currentNormTitle ||
            seenSongKeys.has(cKey) ||
            seenYouTubeIds.has(c.youtubeId)
          ) {
            continue;
          }

          seenSongKeys.add(cKey);
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
      console.warn('[SimilarTracks] Radio query fallback notice:', err);
    }
  }

  return similarList;
}
