import { Track, AITasteProfile } from '@/types';

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

export interface TelemetryInteraction {
  trackId: string;
  weight: number;
  event: string;
  createdAt: Date | string;
}

/**
 * AI-Based Recommendation Engine:
 * Analyzes listening telemetry, calculates decayed user acoustic persona,
 * and scores candidate tracks using multi-factor vector cosine similarity.
 */
export function generateAIRecommendations(
  catalog: Track[],
  interactions: TelemetryInteraction[]
): {
  aiRecommendations: Track[];
  historyBasedTracks: Track[];
  heavyRotation: Track[];
  discoveryMix: Track[];
  artistSpotlight: { artist: string; tracks: Track[] };
  aiTasteProfile: AITasteProfile;
} {
  if (catalog.length === 0) {
    return {
      aiRecommendations: [],
      historyBasedTracks: [],
      heavyRotation: [],
      discoveryMix: [],
      artistSpotlight: { artist: '', tracks: [] },
      aiTasteProfile: {
        summary: 'AI Engine initialized: Cold start baseline.',
        dominantGenres: ['Pop', 'Electronic'],
        energyLevel: 0.7,
        danceability: 0.65,
        acousticness: 0.2,
        totalListens: 0,
      },
    };
  }

  // 1. Calculate weighted listening scores with temporal decay
  const trackWeights = new Map<string, number>();
  const artistWeights = new Map<string, number>();
  const now = Date.now();

  let completedListens = 0;

  for (const item of interactions) {
    const itemDate = new Date(item.createdAt).getTime();
    const daysAgo = Math.max(0, (now - itemDate) / (1000 * 60 * 60 * 24));
    // Temporal decay factor: e^(-0.05 * days)
    const decay = Math.exp(-0.05 * daysAgo);
    const effectiveWeight = item.weight * decay;

    const currentW = trackWeights.get(item.trackId) || 0;
    trackWeights.set(item.trackId, currentW + effectiveWeight);

    if (item.event === 'track_complete') {
      completedListens++;
    }

    const tr = catalog.find((t) => t.id === item.trackId || t.youtubeId === item.trackId);
    if (tr) {
      const artW = artistWeights.get(tr.artist) || 0;
      artistWeights.set(tr.artist, artW + effectiveWeight);
    }
  }

  // 2. Synthesize User 8D Acoustic Persona Centroid
  // [0: energy, 1: valence, 2: tempo, 3: acousticness, 4: danceability, 5: instrumentalness, 6: speechiness, 7: liveness]
  let userCentroid = [0, 0, 0, 0, 0, 0, 0, 0];
  let totalPositiveWeight = 0;

  for (const track of catalog) {
    const w = trackWeights.get(track.id) || trackWeights.get(track.youtubeId) || 0;
    const emb = track.embedding || [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];

    if (w > 0) {
      totalPositiveWeight += w;
      for (let i = 0; i < 8; i++) {
        userCentroid[i] += (emb[i] || 0.5) * w;
      }
    } else if (w < 0) {
      for (let i = 0; i < 8; i++) {
        userCentroid[i] -= (emb[i] || 0.5) * Math.abs(w) * 0.25;
      }
    }
  }

  if (totalPositiveWeight > 0) {
    userCentroid = userCentroid.map((val) => Math.max(0.05, Math.min(0.95, val / totalPositiveWeight)));
  } else {
    userCentroid = [0.72, 0.58, 0.65, 0.22, 0.68, 0.08, 0.06, 0.2];
  }

  // 3. Score all catalog tracks using AI Multi-Factor Equation
  const scoredCatalog = catalog.map((track) => {
    const emb = track.embedding || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const vectorSim = cosineSimilarity(userCentroid, emb);
    const artWeight = artistWeights.get(track.artist) || 0;
    const artistBonus = Math.min(0.25, Math.max(0, artWeight * 0.05));

    const aiScore = vectorSim * 0.75 + artistBonus * 0.25;
    const aiMatch = Math.round(Math.min(99, Math.max(82, (aiScore * 0.35 + 0.65) * 100)));

    return {
      ...track,
      aiMatch,
      aiScore,
    };
  });

  // 4. Generate "AI Recommended For You" (Top scored AI tracks)
  const aiRecommendations = [...scoredCatalog]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 6);

  // 5. Generate "Based on Your Listening History"
  const listenedTrackIds = new Set(
    interactions.filter((i) => i.weight > 0).map((i) => i.trackId)
  );

  const historyBasedTracks = scoredCatalog
    .filter((t) => {
      const artWeight = artistWeights.get(t.artist) || 0;
      return artWeight > 0 || listenedTrackIds.has(t.id);
    })
    .sort((a, b) => (trackWeights.get(b.id) || 0) - (trackWeights.get(a.id) || 0))
    .slice(0, 6);

  const finalHistoryTracks = historyBasedTracks.length >= 3 ? historyBasedTracks : scoredCatalog.slice(2, 8);

  // 6. Heavy Rotation & Discovery Mix
  const heavyRotation = [...catalog]
    .sort((a, b) => (trackWeights.get(b.id) || 0) - (trackWeights.get(a.id) || 0))
    .slice(0, 6);

  const discoveryMix = scoredCatalog
    .filter((t) => (trackWeights.get(t.id) || 0) < 1.0)
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 6);

  // 7. Top Artist Spotlight
  const sortedArtists = Object.entries(Object.fromEntries(artistWeights)).sort((a, b) => b[1] - a[1]);
  const topArtist = sortedArtists.length > 0 ? sortedArtists[0][0] : catalog[0]?.artist || 'Queen';
  const artistTracks = catalog
    .filter((t) => t.artist.toLowerCase().includes(topArtist.toLowerCase()))
    .slice(0, 6);

  // 8. Natural Language AI Taste Profile Summary
  const energy = userCentroid[0];
  const valence = userCentroid[1];
  const danceability = userCentroid[4];
  const acousticness = userCentroid[3];

  let tasteSummary = '';
  if (completedListens > 0) {
    const moodDesc = valence > 0.6 ? 'uplifting & vibrant' : valence < 0.4 ? 'introspective & late-night' : 'dynamic & melodic';
    const energyDesc = energy > 0.7 ? 'high-energy drive' : 'ambient low-distortion textures';
    tasteSummary = `AI Neural Analysis (${completedListens} completed sessions): Tuned to ${moodDesc} harmonics with ${energyDesc}.`;
  } else {
    tasteSummary = 'AI Cold Start Baseline: Calibrated for wide dynamic range, high-tempo rhythm, and spatial studio acoustics.';
  }

  const aiTasteProfile: AITasteProfile = {
    summary: tasteSummary,
    dominantGenres: [topArtist, energy > 0.7 ? 'Synthwave / Pop' : 'Acoustic / Indie'],
    energyLevel: Math.round(energy * 100) / 100,
    danceability: Math.round(danceability * 100) / 100,
    acousticness: Math.round(acousticness * 100) / 100,
    totalListens: completedListens,
  };

  return {
    aiRecommendations,
    historyBasedTracks: finalHistoryTracks,
    heavyRotation,
    discoveryMix: discoveryMix.length > 0 ? discoveryMix : catalog.slice(0, 6),
    artistSpotlight: {
      artist: topArtist,
      tracks: artistTracks.length > 0 ? artistTracks : catalog.slice(3, 9),
    },
    aiTasteProfile,
  };
}
