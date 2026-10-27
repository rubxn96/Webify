import { Track, AITasteProfile } from '@/types';
import { cleanSongTitle, normalizeKey } from '@/lib/youtube/search';

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

  // 4. Identify all listened songs to strictly exclude them from recommendations
  const listenedTrackIds = new Set<string>();
  const listenedSongKeys = new Set<string>();
  const listenedTitles = new Set<string>();

  for (const item of interactions) {
    if (item.trackId) {
      listenedTrackIds.add(item.trackId);
      const tr = catalog.find((t) => t.id === item.trackId || t.youtubeId === item.trackId);
      if (tr) {
        listenedTrackIds.add(tr.id);
        listenedTrackIds.add(tr.youtubeId);
        listenedSongKeys.add(`${normalizeKey(tr.artist)}:::${normalizeKey(cleanSongTitle(tr.title))}`);
        listenedTitles.add(normalizeKey(cleanSongTitle(tr.title)));
      }
    }
  }

  const isAlreadyListened = (track: Track): boolean => {
    if (listenedTrackIds.has(track.id) || listenedTrackIds.has(track.youtubeId)) return true;
    const key = `${normalizeKey(track.artist)}:::${normalizeKey(cleanSongTitle(track.title))}`;
    const tKey = normalizeKey(cleanSongTitle(track.title));
    return listenedSongKeys.has(key) || listenedTitles.has(tKey);
  };

  // Fresh unlistened catalog tracks
  const unlistenedTracks = scoredCatalog.filter((t) => !isAlreadyListened(t));
  const candidatePool = unlistenedTracks.length >= 6 ? unlistenedTracks : scoredCatalog;

  // 5. Generate "AI Recommended For You" (Top AI acoustic matches that user has NOT listened to)
  const aiRecommendations = [...candidatePool]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 6);

  const aiRecIds = new Set(aiRecommendations.map((t) => t.id));

  // 6. Generate "Based on Your Listening History"
  // Recommends FRESH, unlistened songs matching the artists and genres from user's history
  const historyBasedCandidates = [...candidatePool]
    .filter((t) => !aiRecIds.has(t.id))
    .filter((t) => {
      const artWeight = artistWeights.get(t.artist) || 0;
      return artWeight > 0 || (t.aiScore && t.aiScore > 0.72);
    })
    .sort((a, b) => {
      const aArt = artistWeights.get(a.artist) || 0;
      const bArt = artistWeights.get(b.artist) || 0;
      if (bArt !== aArt) return bArt - aArt;
      return (b.aiScore || 0) - (a.aiScore || 0);
    })
    .slice(0, 6);

  const finalHistoryTracks =
    historyBasedCandidates.length >= 3
      ? historyBasedCandidates
      : candidatePool.filter((t) => !aiRecIds.has(t.id)).slice(0, 6);

  const historyIds = new Set(finalHistoryTracks.map((t) => t.id));

  // 7. Heavy Rotation (Top played tracks for hero shelf or quick replay)
  const heavyRotation = [...catalog]
    .sort((a, b) => (trackWeights.get(b.id) || 0) - (trackWeights.get(a.id) || 0))
    .slice(0, 6);

  // 8. Discovery Mix (Fresh unlistened songs with high vector score and low familiarity)
  const discoveryMix = [...candidatePool]
    .filter((t) => !aiRecIds.has(t.id) && !historyIds.has(t.id))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 6);

  // 9. Top Artist Spotlight (Unlistened tracks by favorite artist)
  const sortedArtists = Object.entries(Object.fromEntries(artistWeights)).sort((a, b) => b[1] - a[1]);
  const topArtist = sortedArtists.length > 0 ? sortedArtists[0][0] : catalog[0]?.artist || 'Queen';
  const artistTracks = candidatePool
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
