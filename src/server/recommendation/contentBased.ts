import { Track } from '@/types';
import { cosineSimilarity } from './ranking';

/**
 * Cross-language and cross-genre mood compatibility matrix
 * E.g. Malayalam indie acoustic matches Tamil indie and Hindi acoustic (Prateek Kuhad, Anuv Jain, Rex Vijayan)
 */
const COMPATIBLE_GENRES: Record<string, string[]> = {
  acoustic: ['indie', 'folk', 'classical', 'soulful', 'sufi'],
  indie: ['acoustic', 'pop', 'folk', 'rock', 'mollywood', 'kollywood'],
  bollywood: ['pop', 'dance', 'romantic', 'kollywood', 'tollywood'],
  kollywood: ['bollywood', 'tollywood', 'mollywood', 'dance'],
  mollywood: ['indie', 'acoustic', 'kollywood', 'folk'],
  tollywood: ['kollywood', 'bollywood', 'dance'],
  'hip-hop': ['punjabi pop', 'trap', 'drill', 'dance'],
  'punjabi pop': ['hip-hop', 'dance', 'pop'],
  folk: ['acoustic', 'classical', 'indie'],
  classical: ['folk', 'acoustic', 'sufi'],
  dance: ['party', 'bollywood', 'kollywood', 'punjabi pop'],
};

export interface ContentSimilarityOptions {
  preferredLanguages?: string[];
  preferredGenres?: string[];
  seedTrack?: Track;
  userCentroid?: number[];
}

export class ContentBasedRecommender {
  /**
   * Computes multi-attribute content similarity between candidate track and user preferences / seed
   * Returns a normalized score in [0.0, 1.0]
   */
  public computeSimilarity(candidate: any, options: ContentSimilarityOptions): number {
    const { preferredLanguages = [], preferredGenres = [], seedTrack, userCentroid } = options;

    let languageScore = 0;
    let genreScore = 0;
    let tagScore = 0;
    let vectorScore = 0;
    let eraScore = 0.5;

    const candLang = (candidate.language || '').toLowerCase();
    const candGenre = (candidate.genre || '').toLowerCase();
    const candTags: string[] = Array.isArray(candidate.tags)
      ? (candidate.tags as any[]).map((t) => String(t).toLowerCase())
      : [];

    // 1. Language Similarity
    if (seedTrack?.language) {
      const seedLang = seedTrack.language.toLowerCase();
      if (candLang === seedLang) {
        languageScore = 1.0;
      } else if (preferredLanguages.map((l) => l.toLowerCase()).includes(candLang)) {
        languageScore = 0.8;
      } else {
        languageScore = 0.3; // Cross-language exploration baseline
      }
    } else if (preferredLanguages.length > 0) {
      languageScore = preferredLanguages.map((l) => l.toLowerCase()).includes(candLang) ? 1.0 : 0.4;
    } else {
      languageScore = 0.7; // Cold-start neutral
    }

    // 2. Genre Similarity & Mood Bridge
    if (seedTrack?.genre) {
      const seedGenre = seedTrack.genre.toLowerCase();
      if (candGenre === seedGenre) {
        genreScore = 1.0;
      } else if (COMPATIBLE_GENRES[seedGenre]?.includes(candGenre)) {
        genreScore = 0.75;
      } else if (preferredGenres.map((g) => g.toLowerCase()).includes(candGenre)) {
        genreScore = 0.7;
      } else {
        genreScore = 0.2;
      }
    } else if (preferredGenres.length > 0) {
      genreScore = preferredGenres.map((g) => g.toLowerCase()).includes(candGenre) ? 1.0 : 0.3;
    } else {
      genreScore = 0.6;
    }

    // 3. Tag Jaccard Overlap
    if (seedTrack?.tags && seedTrack.tags.length > 0) {
      const seedTags = new Set(seedTrack.tags.map((t: string) => t.toLowerCase()));
      const intersection = candTags.filter((t: string) => seedTags.has(t)).length;
      const union = new Set([...candTags, ...Array.from(seedTags)]).size;
      tagScore = union > 0 ? intersection / union : 0;
    } else {
      tagScore = candTags.length > 0 ? 0.5 : 0.2;
    }

    // 4. Acoustic 8D Vector Embedding Cosine Similarity
    const defaultVector = [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2];
    const candVector =
      Array.isArray(candidate.embedding) && candidate.embedding.length === 8 ? candidate.embedding : defaultVector;

    const referenceVector =
      seedTrack?.embedding && seedTrack.embedding.length === 8
        ? seedTrack.embedding
        : userCentroid && userCentroid.length === 8
        ? userCentroid
        : defaultVector;

    const rawSim = cosineSimilarity(referenceVector, candVector);
    vectorScore = Math.max(0, Math.min(1, (rawSim + 1) / 2)); // Normalized from [-1, 1] to [0, 1]

    // 5. Release Era Similarity
    if (seedTrack?.releaseDate && candidate.releaseDate) {
      const seedYear = new Date(seedTrack.releaseDate).getFullYear();
      const candYear = new Date(candidate.releaseDate).getFullYear();
      const diff = Math.abs(seedYear - candYear);
      eraScore = Math.max(0.2, 1.0 - diff * 0.05); // Within 5 years gets >= 0.75
    }

    // Weighted content sum:
    // 30% Genre + 25% Vector + 25% Language + 10% Tags + 10% Era
    const finalScore =
      genreScore * 0.3 + vectorScore * 0.25 + languageScore * 0.25 + tagScore * 0.1 + eraScore * 0.1;

    return Math.max(0, Math.min(1, parseFloat(finalScore.toFixed(4))));
  }
}

export const contentBasedRecommender = new ContentBasedRecommender();

