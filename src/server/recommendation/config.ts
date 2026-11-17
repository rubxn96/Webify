/**
 * Advanced Music Recommendation Engine Configuration
 * All interaction weights, hybrid scoring weights, and decay parameters are fully configurable here.
 */

export const INTERACTION_WEIGHTS = {
  // Song played (+1)
  track_start: 1.0,

  // Listened to 80% or more (+3)
  track_80_percent: 3.0,

  // Song completed (+3)
  track_complete: 3.0,

  // Liked song (+5)
  track_like: 5.0,

  // Disliked song (-5)
  track_dislike: -5.0,

  // Added to playlist (+4)
  playlist_add: 4.0,

  // Replayed / repeated song (+4)
  track_repeat: 4.0,

  // Skipped within 10 seconds or < 20% (-3)
  track_skip_early: -3.0,

  // Standard skip (-1.5)
  track_skip_late: -1.5,

  // Removed from playlist (-1)
  playlist_remove: -1.0,

  // Artist followed (+3)
  artist_follow: 3.0,

  // Relevant search query (+0.5)
  search_query: 0.5,
};

export const HYBRID_WEIGHTS = {
  // 40% Content-based similarity
  contentBased: 0.4,

  // 30% Collaborative filtering
  collaborative: 0.3,

  // 20% User preference & listening history
  userPreference: 0.2,

  // 10% Trending and freshness
  trendingFreshness: 0.1,
};

export const DECAY_PARAMS = {
  // Exponential decay parameter: e^(-lambda * days) -> 14 days half-life
  lambda: 0.05,

  // Max repeats per hour before diminishing returns logarithmic dampening
  maxHourlyRepeatsBeforeDampening: 3,

  // Duration in seconds to classify an early skip (negative preference signal)
  earlySkipThresholdSeconds: 10,

  // Percentage threshold for deep completion signal
  completionThresholdRatio: 0.8,
};

export const DIVERSITY_RULES = {
  // Max songs by the exact same primary artist in a single recommendation rail
  maxSongsPerArtistPerRail: 2,

  // Minimum similarity score to be considered for recommendation
  minSimilarityThreshold: 0.15,

  // Candidate pool size to retrieve before ranking & diversity filtering
  candidatePoolSize: 120,
};

