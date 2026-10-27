import { Track } from '@/types';

/**
 * Computes Cosine Similarity between two N-dimensional numerical vectors.
 */
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

/**
 * Finds most similar tracks in catalog to target track using cosine similarity.
 */
export function findSimilarTracks(
  targetTrack: Track,
  catalog: Track[],
  limit: number = 6
): (Track & { similarity: number })[] {
  const targetEmbedding = targetTrack.embedding || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  return catalog
    .filter((t) => t.id !== targetTrack.id && t.youtubeId !== targetTrack.youtubeId)
    .map((t) => {
      const embedding = t.embedding || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
      const similarity = cosineSimilarity(targetEmbedding, embedding);
      return { ...t, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Aggregates user listening vectors and produces personalized rails:
 * 1. "Heavy Rotation"
 * 2. "Discovery Mix" (low familiarity, high vector similarity)
 * 3. "Because you like [Top Artist]"
 */
export function generateDiscoveryRails(
  catalog: Track[],
  userInteractions: Array<{ trackId: string; weight: number }>
) {
  if (catalog.length === 0) {
    return {
      heavyRotation: [],
      discoveryMix: [],
      artistSpotlight: { artist: '', tracks: [] },
    };
  }

  // Weight map
  const weightMap = new Map<string, number>();
  for (const item of userInteractions) {
    const cur = weightMap.get(item.trackId) || 0;
    weightMap.set(item.trackId, cur + item.weight);
  }

  // 1. Heavy Rotation (tracks with highest positive weights or top fallback)
  const heavyRotation = [...catalog]
    .sort((a, b) => (weightMap.get(b.id) || 0) - (weightMap.get(a.id) || 0))
    .slice(0, 6);

  // 2. Compute User Taste Centroid
  let tasteCentroid = [0, 0, 0, 0, 0, 0, 0, 0];
  let totalPositiveWeight = 0;

  for (const track of catalog) {
    const w = weightMap.get(track.id) || 0;
    if (w > 0 && track.embedding) {
      totalPositiveWeight += w;
      for (let i = 0; i < 8; i++) {
        tasteCentroid[i] += (track.embedding[i] || 0.5) * w;
      }
    }
  }

  if (totalPositiveWeight > 0) {
    tasteCentroid = tasteCentroid.map((val) => val / totalPositiveWeight);
  } else {
    // Default upbeat balanced centroid
    tasteCentroid = [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];
  }

  // 3. Discovery Mix: high similarity to centroid, but lowest user familiarity (lowest weight)
  const discoveryMix = catalog
    .filter((t) => (weightMap.get(t.id) || 0) < 1.0)
    .map((t) => {
      const emb = t.embedding || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
      const similarity = cosineSimilarity(tasteCentroid, emb);
      return { ...t, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);

  // 4. Top artist recommendation
  const artistCounts: Record<string, number> = {};
  for (const item of userInteractions) {
    if (item.weight > 0) {
      const tr = catalog.find((t) => t.id === item.trackId);
      if (tr) {
        artistCounts[tr.artist] = (artistCounts[tr.artist] || 0) + item.weight;
      }
    }
  }

  const sortedArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
  const topArtist = sortedArtists.length > 0 ? sortedArtists[0][0] : catalog[0]?.artist || 'Queen';

  const artistTracks = catalog
    .filter((t) => t.artist.toLowerCase().includes(topArtist.toLowerCase()))
    .slice(0, 6);

  const fallbackArtistTracks = artistTracks.length > 0 ? artistTracks : catalog.slice(3, 9);

  return {
    heavyRotation,
    discoveryMix: discoveryMix.length > 0 ? discoveryMix : catalog.slice(0, 6),
    artistSpotlight: {
      artist: topArtist,
      tracks: fallbackArtistTracks,
    },
  };
}
