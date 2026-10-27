export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_BAND_LABELS = [
  '32Hz',
  '64Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
  '16kHz',
];

export type EQPresetName = 'Flat' | 'Bass Boost' | 'Vocal' | 'Acoustic' | 'Electronic' | 'Custom';

export const EQ_PRESETS: Record<EQPresetName, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [7.0, 5.5, 3.5, 1.5, 0.0, 0.0, 0.0, 0.5, 1.5, 2.0],
  Vocal: [-2.0, -2.0, -1.0, 0.5, 2.5, 4.0, 3.5, 2.0, 0.0, -1.0],
  Acoustic: [3.5, 2.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 3.0, 2.5],
  Electronic: [6.5, 5.0, 2.5, 0.5, -1.0, 1.5, 2.5, 4.0, 4.5, 5.0],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const NORMALIZER_SETTINGS = {
  threshold: -24, // dB
  knee: 30, // dB
  ratio: 12,
  attack: 0.003, // 3ms
  release: 0.25, // 250ms
};

export const DEFAULT_USER_SETTINGS = {
  bitrate: 'high' as const,
  normalization: true,
  crossfade: 2,
  eqEnabled: true,
  eqPreset: 'Flat' as const,
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
