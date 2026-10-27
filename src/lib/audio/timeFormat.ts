import { LyricLine } from '@/types';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + ms / 1000;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

