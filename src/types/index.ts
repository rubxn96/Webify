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
  embedding?: number[]; // Audio vector for recommendation
  lyrics?: string; // LRC formatted string or JSON
  isLiked?: boolean;
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

export interface TelemetryPayload {
  trackId: string;
  event: 'track_start' | 'track_progress' | 'track_skip' | 'track_complete';
  progressSeconds: number;
  durationSeconds: number;
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
