import { Track } from '@/types';
import { youtubeProvider, cleanNorm } from '@/server/providers/youtube.adapter';
import { cleanSongTitle } from '@/lib/youtube/search';
import { rankDiscoveryStation, rankHeavyRotation } from './ranking';

/**
 * Dynamic Personalized Radio Mix Blending
 * Blends familiar favorites (30%), artist neighbors/mix (30%), and vector discovery (40%).
 */
export async function generatePersonalizedRadio(
  seedTrack: {
    youtubeId: string;
    title: string;
    artist: string;
    embedding?: number[];
  },
  tasteVector: number[] = [],
  userId?: string,
  limit: number = 20
): Promise<Track[]> {
  const radioTracks: Track[] = [];
  const seenIds = new Set<string>([seedTrack.youtubeId]);
  const seenSongKeys = new Set<string>();

  const baseTitle = cleanNorm(cleanSongTitle(seedTrack.title));
  const baseKey = `${cleanNorm(seedTrack.artist)}:::${baseTitle}`;
  seenSongKeys.add(baseKey);

  // 1. Fetch related tracks from YouTube Provider RDAMVM Scraper (30%)
  const mixTargets = Math.ceil(limit * 0.35);
  try {
    const scraped = await youtubeProvider.scrapeRelatedMix(seedTrack.youtubeId, mixTargets + 5);
    for (const t of scraped) {
      const tNorm = cleanNorm(cleanSongTitle(t.title));
      const tKey = `${cleanNorm(t.artist)}:::${tNorm}`;
      if (!seenIds.has(t.youtubeId) && !seenSongKeys.has(tKey) && tNorm !== baseTitle) {
        seenIds.add(t.youtubeId);
        seenSongKeys.add(tKey);
        radioTracks.push(t);
      }
      if (radioTracks.length >= mixTargets) break;
    }
  } catch (err) {
    console.warn('[PersonalizedRadio] scrapeRelatedMix error:', err);
  }

  // 2. Add Vector Discovery Tracks (40%)
  const discoveryTargets = Math.ceil(limit * 0.4);
  try {
    const discoveryTracks = await rankDiscoveryStation(tasteVector, userId, discoveryTargets + 5);
    for (const t of discoveryTracks) {
      const tNorm = cleanNorm(cleanSongTitle(t.title));
      const tKey = `${cleanNorm(t.artist)}:::${tNorm}`;
      if (!seenIds.has(t.youtubeId) && !seenSongKeys.has(tKey) && tNorm !== baseTitle) {
        seenIds.add(t.youtubeId);
        seenSongKeys.add(tKey);
        radioTracks.push(t);
      }
      if (radioTracks.length >= mixTargets + discoveryTargets) break;
    }
  } catch (err) {
    console.warn('[PersonalizedRadio] discovery ranking error:', err);
  }

  // 3. Add Familiar Favorites / Heavy Rotation (30%)
  const remaining = limit - radioTracks.length;
  if (remaining > 0) {
    try {
      const heavy = await rankHeavyRotation(userId, remaining + 5);
      for (const t of heavy) {
        const tNorm = cleanNorm(cleanSongTitle(t.title));
        const tKey = `${cleanNorm(t.artist)}:::${tNorm}`;
        if (!seenIds.has(t.youtubeId) && !seenSongKeys.has(tKey) && tNorm !== baseTitle) {
          seenIds.add(t.youtubeId);
          seenSongKeys.add(tKey);
          radioTracks.push(t);
        }
        if (radioTracks.length >= limit) break;
      }
    } catch {
      // Continue
    }
  }

  return radioTracks;
}

