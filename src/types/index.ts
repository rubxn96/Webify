export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  duration: number; // in seconds
  thumbnail: string;
  audioUrl?: string;
  embedding?: number[]; // 8D native float vector for discovery similarity
  lyrics?: string; // LRC formatted string or JSON
  language?: string; // 'hindi' | 'malayalam' | 'tamil' | 'telugu' | 'kannada' | 'punjabi' | 'bengali' | 'marathi'
  genre?: string; // 'Bollywood' | 'Indie' | 'Pop' | 'Hip-Hop' | 'Folk' | 'Classical' | 'Acoustic' | 'Rock'
  tags?: string[];
  releaseDate?: string | Date;
  popularity?: number;
  playCount?: number;
  jioSaavnId?: string;
  mbid?: string;
  primaryArtists?: string[];
  featuredArtists?: string[];
  isLiked?: boolean;
  source?: 'youtube' | 'catalog';
  aiMatch?: number; // AI match percentage (e.g. 96)
  recommendationScore?: number;
  matchReason?: string;
}

export interface AITasteProfile {
  summary: string;
  dominantGenres: string[];
  energyLevel: number;
  danceability: number;
  acousticness: number;
  totalListens: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  userId: string;
  tracks: Track[];
  trackCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  bitrate: 'auto' | 'normal' | 'high'; // auto, 128kbps AAC, 160kbps Opus
  normalization: boolean; // -14 LUFS DynamicsCompressorNode
  crossfade: number; // 0s to 12s
  eqEnabled: boolean;
  eqPreset: 'Flat' | 'Bass Boost' | 'Vocal' | 'Acoustic' | 'Electronic' | 'Custom';
  eqBands: number[]; // 10 bands or 6 bands (-12dB to +12dB)
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type ListeningEventType =
  | 'track_start'
  | 'track_progress'
  | 'track_80_percent'
  | 'track_complete'
  | 'track_like'
  | 'track_dislike'
  | 'playlist_add'
  | 'playlist_remove'
  | 'track_repeat'
  | 'track_skip'
  | 'artist_follow'
  | 'search_query';

export interface TelemetryPayload {
  trackId: string;
  event: ListeningEventType | 'track_start' | 'track_progress' | 'track_skip' | 'track_complete';
  progressSeconds?: number;
  durationSeconds?: number;
  sessionId?: string;
  youtubeId?: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface UserPreferenceData {
  preferredLanguages: string[];
  preferredGenres: string[];
  topArtists: string[];
  dislikedTrackIds: string[];
  dislikedArtistNames: string[];
  affinityScores?: Record<string, number>;
}

export interface ArtistDiscovery {
  artist: string;
  image?: string;
  genres: string[];
  language?: string;
  tracks: Track[];
}

export interface DiscoveryRecommendationsResponse {
  madeForYou: Track[];
  recommendedForYou: Track[];
  becauseYouListenedTo: { seed: Track; tracks: Track[] } | null;
  similarSongs: Track[];
  discoverNewArtists: ArtistDiscovery[];
  trendingIndia: Track[];
  trendingInYourLanguages: Record<string, Track[]>;
  recentlyReleased: Track[];
  hiddenGems: Track[];
  dailyMix: Track[];

  // Compatibility fields for existing HomePage rails
  hero?: Track | null;
  quickAccess?: Track[];
  vibeRecommendations?: Track[];
  recentVibeSeed?: { title: string; artist: string; summary?: string } | null;
  recentlyPlayed?: Track[];
  latestHindi?: Track[];
  trendingSouth?: Track[];
  punjabiDesiHipHop?: Track[];
  acousticSoul?: Track[];
  userFavorites?: Track[];
  aiRecommendations?: Track[];
  historyBasedTracks?: Track[];
  heavyRotation?: Track[];
  discoveryMix?: Track[];
  artistSpotlight?: { artist: string; tracks: Track[] };
  aiTasteProfile?: AITasteProfile;
}

export interface ImportException {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  reason: string;
}

export interface ImportJobStatus {
  id: string;
  source: 'spotify' | 'apple_music';
  sourceUrl: string;
  playlistTitle?: string;
  totalTracks: number;
  matchedTracks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  unresolvedTracks: ImportException[];
  matchedPlaylistId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  settings: UserSettings;
}

