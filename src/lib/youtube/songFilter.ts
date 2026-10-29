/**
 * Universal Song Filtering & Normalization Utilities
 * Pure JavaScript with zero server or client specific dependencies.
 * Safe to import in both client ('use client') and server environments.
 */

export function cleanNorm(s: string): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function cleanSongTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*\(Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|Lyrics|Visualizer)?\)/gi, '')
    .replace(/\s*\[Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|Lyrics|Visualizer)?\]/gi, '')
    .replace(/\s*\((?:Music\s*)?Video\)/gi, '')
    .replace(/\s*\[(?:Music\s*)?Video\]/gi, '')
    .replace(/\s*\((?:Lyric\s*Video|Lyrics|Audio|Visualizer|Audio\s*Visualizer)\)/gi, '')
    .replace(/\s*\[(?:Lyric\s*Video|Lyrics|Audio|Visualizer|Audio\s*Visualizer)\]/gi, '')
    .replace(/\s*\((?:HD|4K|HQ|Remastered|Explicit|Clean)\)/gi, '')
    .replace(/\s*\[(?:HD|4K|HQ|Remastered|Explicit|Clean)\]/gi, '')
    .replace(/\s*\|\s*Official\s*.*$/gi, '')
    .replace(/\s*-\s*Official\s*.*$/gi, '')
    .trim();
}

export const KNOWN_RECORD_LABELS = new Set([
  'saregama',
  'saregamamusic',
  'saregamahumbhojpuri',
  'tseries',
  'tseriesbhaktisagar',
  'tseriesregional',
  'sonymusic',
  'sonymusicindia',
  'sonymusicsouth',
  'zeemusic',
  'zeemusiccompany',
  'zeemusicsouth',
  'tipsofficial',
  'tips',
  'tipsfilms',
  'tipsbhojpuri',
  'tipspunjabi',
  'yrf',
  'yashrajfilms',
  'speedrecords',
  'thinkmusic',
  'thinkmusicindia',
  'adityamusic',
  'laharimusic',
  'anandaudio',
  'muzik247',
  'whitehillmusic',
  'geetmp3',
  'erosnow',
  'timesmusic',
  'venus',
  'venusworldwide',
  'worldmusicday',
  'evergreendancehits',
  'carvaanselect',
  'carvaanclassicradioshowhindi',
  'dmdesimelodies',
  'svfmusic',
  'youtube',
]);

export function isRecordLabel(name?: string | null): boolean {
  if (!name) return false;
  const n = cleanNorm(name);
  if (KNOWN_RECORD_LABELS.has(n)) return true;
  for (const label of KNOWN_RECORD_LABELS) {
    if (n.includes(label)) return true;
  }
  return false;
}

const COMPILATION_PATTERNS = [
  /\bjukebox\b/i,
  /\bradio\s*show\b/i,
  /\bcarvaan\b/i,
  /\bnonstop\b/i,
  /\bnon-stop\b/i,
  /\bnon\s+stop\b/i,
  /\bcompilation\b/i,
  /\bmashup\b/i,
  /\ball\s+songs\b/i,
  /\bentire\s+album\b/i,
  /\bfull\s+album\b/i,
  /\bcomplete\s+album\b/i,
  /\bcollection\b/i,
  /\banthology\b/i,
  /\bsuperhits\b/i,
  /\banthems\b/i,
  /\bhit\s+collection\b/i,
  /\btop\s*\d+\b/i,
  /\b\d+\s+songs\b/i,
  /\b\d+\s+nonstop\b/i,
  /\bpodcast\b/i,
  /\bepisode\b/i,
  /\bseason\s*\d+\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bpromo\b/i,
  /\binterview\b/i,
  /\bpress\s+meet\b/i,
  /\bbehind\s+the\s+scenes\b/i,
  /\bmaking\s+of\b/i,
  /\bdialogue\b/i,
  /\bscenes?\b/i,
  /\bmovie\s+scene\b/i,
  /\bclimax\b/i,
  /\bcomedy\s+scene\b/i,
  /\bringtone\b/i,
  /\bstatus\b/i,
  /\bbgm\b/i,
  /\btheme\s+music\b/i,
  /\b\d+\s*(?:hours?|hrs?)\b/i,
  /\bparty\s+songs\b/i,
  /\bparty\s+mix\b/i,
  /\bdj\s+mix\b/i,
  /\bmegamix\b/i,
  /\bmega\s+mix\b/i,
  /\bretro\s+&\s+chill\b/i,
  /\bvintage\s+hits\b/i,
];

export function isCompilationOrShow(title: string, artist?: string): boolean {
  const combined = `${title || ''} ${artist || ''}`;
  return COMPILATION_PATTERNS.some((pattern) => pattern.test(combined));
}

/**
 * Strict validator for a pristine standalone music track:
 * 1. Must be between 80s (1m 20s) and 450s (7m 30s)
 * 2. Must not be a compilation, radio show, jukebox, full album, trailer, or podcast
 */
export function isPristineSongTrack(track: {
  title: string;
  artist?: string;
  duration?: number;
}): boolean {
  if (!track.title || !track.title.trim()) return false;

  if (typeof track.duration === 'number' && track.duration > 0) {
    if (track.duration < 80 || track.duration > 450) {
      return false;
    }
  }

  if (isCompilationOrShow(track.title, track.artist)) {
    return false;
  }

  return true;
}

