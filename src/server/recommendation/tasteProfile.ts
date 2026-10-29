import prisma from '@/lib/db/prisma';
import { AITasteProfile } from '@/types';

const DEFAULT_CENTROID = [0.72, 0.58, 0.65, 0.22, 0.68, 0.08, 0.06, 0.2];

/**
 * Calculates decayed user acoustic persona centroid and persists to PostgreSQL User.tasteVector
 */
export async function updateAndPersistTasteProfile(userId: string): Promise<{
  tasteVector: number[];
  profile: AITasteProfile;
}> {
  // Fetch telemetry interactions for the user ordered by recent first
  const interactions = await prisma.telemetry.findMany({
    where: { userId },
    include: { track: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  if (interactions.length === 0) {
    const profile: AITasteProfile = {
      summary: 'AI Engine initialized: Cold start baseline.',
      dominantGenres: ['Pop', 'Electronic'],
      energyLevel: DEFAULT_CENTROID[0],
      danceability: DEFAULT_CENTROID[4],
      acousticness: DEFAULT_CENTROID[3],
      totalListens: 0,
    };
    return { tasteVector: DEFAULT_CENTROID, profile };
  }

  const now = Date.now();
  let userCentroid = [0, 0, 0, 0, 0, 0, 0, 0];
  let totalPositiveWeight = 0;
  let totalListens = 0;
  const genreCount = new Map<string, number>();

  for (const item of interactions) {
    const itemDate = new Date(item.createdAt).getTime();
    const daysAgo = Math.max(0, (now - itemDate) / (1000 * 60 * 60 * 24));
    // Temporal decay factor: e^(-0.05 * days)
    const decay = Math.exp(-0.05 * daysAgo);
    const effectiveWeight = item.weight * decay;

    if (item.event === 'track_complete') {
      totalListens++;
    }

    const emb =
      Array.isArray(item.track?.embedding) && item.track.embedding.length > 0
        ? item.track.embedding
        : DEFAULT_CENTROID;

    if (effectiveWeight > 0) {
      totalPositiveWeight += effectiveWeight;
      for (let i = 0; i < 8; i++) {
        userCentroid[i] += (emb[i] || 0.5) * effectiveWeight;
      }
    } else if (effectiveWeight < 0) {
      for (let i = 0; i < 8; i++) {
        userCentroid[i] -= (emb[i] || 0.5) * Math.abs(effectiveWeight) * 0.25;
      }
    }

    if (item.track?.album) {
      genreCount.set(item.track.album, (genreCount.get(item.track.album) || 0) + 1);
    }
  }

  if (totalPositiveWeight > 0) {
    userCentroid = userCentroid.map((val) =>
      Math.max(0.05, Math.min(0.95, parseFloat((val / totalPositiveWeight).toFixed(4))))
    );
  } else {
    userCentroid = [...DEFAULT_CENTROID];
  }

  // Persist updated taste vector to User record
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { tasteVector: userCentroid },
    });
  } catch (err) {
    console.warn('[TasteProfile] could not persist tasteVector:', err);
  }

  const sortedGenres = Array.from(genreCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .slice(0, 3);

  const dominantGenres = sortedGenres.length > 0 ? sortedGenres : ['Pop', 'Electronic', 'Hi-Fi'];

  const profile: AITasteProfile = {
    summary: `Taste profile calibrated across ${totalListens} completed sessions.`,
    dominantGenres,
    energyLevel: userCentroid[0],
    danceability: userCentroid[4],
    acousticness: userCentroid[3],
    totalListens,
  };

  return { tasteVector: userCentroid, profile };
}

