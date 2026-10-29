import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UserSettingsSchema = z.object({
  bitrate: z.enum(['auto', 'normal', 'high']).default('high'),
  normalization: z.boolean().default(true),
  crossfade: z.number().min(0).max(12).default(2),
  eqEnabled: z.boolean().default(true),
  eqPreset: z.enum(['Flat', 'Bass Boost', 'Vocal', 'Acoustic', 'Electronic', 'Custom']).default('Flat'),
  eqBands: z.array(z.number()).default([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
});

export const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  isPublic: z.boolean().default(true),
});

export const AddTrackToPlaylistSchema = z.object({
  track: z.object({
    youtubeId: z.string().min(1),
    title: z.string().min(1),
    artist: z.string().min(1),
    duration: z.number().default(180),
    thumbnail: z.string().default(''),
    album: z.string().optional(),
    lyrics: z.string().optional(),
  }),
});

export const TelemetrySchema = z.object({
  trackId: z.string().min(1),
  event: z.enum(['track_start', 'track_progress', 'track_skip', 'track_complete']),
  progressSeconds: z.number().default(0),
  durationSeconds: z.number().default(0),
  sessionId: z.string().optional(),
  youtubeId: z.string().optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  thumbnail: z.string().optional(),
});

export const SyncTrackSchema = z.object({
  youtubeId: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  duration: z.number().default(180),
  thumbnail: z.string().default(''),
  album: z.string().optional(),
  lyrics: z.string().optional(),
  isrc: z.string().optional(),
});
