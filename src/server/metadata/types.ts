export type IndianLanguage =
  | 'malayalam'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'hindi'
  | 'punjabi'
  | 'bengali'
  | 'marathi';

export const SUPPORTED_INDIAN_LANGUAGES: IndianLanguage[] = [
  'malayalam',
  'tamil',
  'telugu',
  'kannada',
  'hindi',
  'punjabi',
  'bengali',
  'marathi',
];

export interface RawSongMetadata {
  title: string;
  artist: string;
  primaryArtists: string[];
  featuredArtists: string[];
  album?: string;
  releaseDate?: Date;
  releaseYear?: number;
  language?: IndianLanguage | string;
  genre?: string;
  tags: string[];
  duration: number; // seconds
  popularity: number; // 0 to 100
  thumbnail: string;
  isrc?: string;
  jioSaavnId?: string;
  mbid?: string;
  youtubeId?: string;
  lyrics?: string;
  embedding?: number[];
}

