import { Track } from '@/types';

export interface StreamResolutionOptions {
  tier?: 'high' | 'normal' | 'low';
  preferredFormat?: 'mp4' | 'webm' | 'any';
}

export interface StreamResolutionResult {
  audioUrl: string | null;
  rawStreamUrl?: string | null;
  mimeType: string;
  bitrate: number;
  duration?: number;
  source: 'direct' | 'iframe';
  isProxied?: boolean;
}

export interface TrackMetadataMatchQuery {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  durationSeconds?: number;
}

export interface TrackMatchResult {
  matched: boolean;
  trackId?: string;
  track?: Track;
  confidence: number;
}

export interface IMusicProviderAdapter {
  search(query: string, limit?: number): Promise<Track[]>;
  resolveStream(id: string, options?: StreamResolutionOptions): Promise<StreamResolutionResult>;
  scrapeRelatedMix(seedTrackId: string, limit?: number): Promise<Track[]>;
  matchExternalTrack(query: TrackMetadataMatchQuery): Promise<TrackMatchResult>;
}

