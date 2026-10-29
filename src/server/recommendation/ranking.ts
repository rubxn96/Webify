import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { cleanSongTitle, normalizeKey } from '@/lib/youtube/search';
import { SEED_TRACKS } from '@/lib/db/seedData';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const DEFAULT_VECTOR = [0.72, 0.58, 0.65, 0.22, 0.68, 0.08, 0.06, 0.2];

/**
 * Made For You: Blended affinity between user tasteVector and catalog embeddings,
 * strictly excluding songs already listened to.
 */
export async function rankMadeForYou(
  tasteVector: number[],
  userId?: string,
  limit: number = 15
): Promise<Track[]> {
  let catalog: any[] = [];
  try {
    catalog = await prisma.track.findMany({ take: 100 });
  } catch {
    catalog = SEED_TRACKS.map((st, idx) => ({
      id: `seed-${idx}`,
      ...st,
    }));
  }
  if (catalog.length === 0) return [];

  // Exclude listened tracks if user is provided
  const listenedTrackIds = new Set<string>();
  const listenedKeys = new Set<string>();

  if (userId) {
    try {
      const history = await prisma.telemetry.findMany({
        where: { userId },
        select: { trackId: true },
        take: 150,
      });
      history.forEach((h) => listenedTrackIds.add(h.trackId));
    } catch {
      // offline database fallback
    }
  }

  const scored = catalog
    .filter((t) => {
      const key = `${normalizeKey(t.artist)}:::${normalizeKey(cleanSongTitle(t.title))}`;
      if (listenedTrackIds.has(t.id) || listenedTrackIds.has(t.youtubeId) || listenedKeys.has(key)) {
        return false;
      }
      listenedKeys.add(key);
      return true;
    })
    .map((t) => {
      const emb = Array.isArray(t.embedding) && t.embedding.length > 0 ? t.embedding : DEFAULT_VECTOR;
      const sim = cosineSimilarity(tasteVector.length > 0 ? tasteVector : DEFAULT_VECTOR, emb);
      const aiMatch = Math.round(Math.min(99, Math.max(80, (sim * 0.35 + 0.65) * 100)));
      return {
        id: t.id,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album || undefined,
        duration: t.duration,
        thumbnail: t.thumbnail,
        embedding: emb,
        lyrics: t.lyrics || undefined,
        source: 'catalog' as const,
        aiMatch,
        sim,
      };
    })
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);

  return scored;
}

/**
 * Heavy Rotation: Most frequently played and completed tracks with highest interaction weights
 */
export async function rankHeavyRotation(userId?: string, limit: number = 10): Promise<Track[]> {
  let interactions: any[] = [];
  if (userId) {
    try {
      interactions = await prisma.telemetry.findMany({
        where: { userId },
        include: { track: true },
        take: 200,
      });
    } catch {
      interactions = [];
    }
  }

  if (interactions.length === 0) {
    let topTracks: any[] = [];
    try {
      topTracks = await prisma.track.findMany({ take: limit });
    } catch {
      topTracks = SEED_TRACKS.slice(0, limit).map((st, idx) => ({
        id: `seed-${idx}`,
        ...st,
      }));
    }
    return topTracks.map((t) => ({
      id: t.id,
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      album: t.album || undefined,
      duration: t.duration,
      thumbnail: t.thumbnail,
      source: 'catalog',
      aiMatch: 95,
    }));
  }

  const trackScores = new Map<string, { track: Track; weight: number; count: number }>();

  for (const item of interactions) {
    if (!item.track) continue;
    const existing = trackScores.get(item.trackId) || {
      track: {
        id: item.track.id,
        youtubeId: item.track.youtubeId,
        title: item.track.title,
        artist: item.track.artist,
        album: item.track.album || undefined,
        duration: item.track.duration,
        thumbnail: item.track.thumbnail,
        lyrics: item.track.lyrics || undefined,
        source: 'catalog',
      },
      weight: 0,
      count: 0,
    };

    existing.weight += item.weight;
    existing.count += 1;
    trackScores.set(item.trackId, existing);
  }

  const sorted = Array.from(trackScores.values())
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((entry) => ({
      ...entry.track,
      aiMatch: Math.min(99, Math.round(90 + Math.min(9, entry.count * 2))),
    }));

  return sorted;
}

/**
 * Discovery Station: Sim * (1 - familiarity) with exploration bonus
 */
export async function rankDiscoveryStation(
  tasteVector: number[],
  userId?: string,
  limit: number = 10
): Promise<Track[]> {
  let catalog: any[] = [];
  try {
    catalog = await prisma.track.findMany({ take: 100 });
  } catch {
    catalog = SEED_TRACKS.map((st, idx) => ({ id: `seed-${idx}`, ...st }));
  }
  const playCounts = new Map<string, number>();

  if (userId) {
    try {
      const history = await prisma.telemetry.findMany({
        where: { userId },
        select: { trackId: true },
        take: 200,
      });
      for (const h of history) {
        playCounts.set(h.trackId, (playCounts.get(h.trackId) || 0) + 1);
      }
    } catch {
      // offline database fallback
    }
  }

  const scored = catalog
    .map((t) => {
      const emb = Array.isArray(t.embedding) && t.embedding.length > 0 ? t.embedding : DEFAULT_VECTOR;
      const sim = cosineSimilarity(tasteVector.length > 0 ? tasteVector : DEFAULT_VECTOR, emb);
      const plays = playCounts.get(t.id) || 0;
      // Familiarity metric: 0 for never listened, scaling to 1.0 at 5 listens
      const familiarity = Math.min(1, plays / 5);
      // Discovery score: High acoustic similarity with exploration bonus for novelty
      const discoveryScore = sim * (1 - familiarity * 0.85);
      const aiMatch = Math.round(Math.min(98, Math.max(75, (discoveryScore * 0.4 + 0.6) * 100)));

      return {
        id: t.id,
        youtubeId: t.youtubeId,
        title: t.title,
        artist: t.artist,
        album: t.album || undefined,
        duration: t.duration,
        thumbnail: t.thumbnail,
        embedding: emb,
        lyrics: t.lyrics || undefined,
        source: 'catalog' as const,
        aiMatch,
        discoveryScore,
      };
    })
    .sort((a, b) => b.discoveryScore - a.discoveryScore)
    .slice(0, limit);

  return scored;
}

