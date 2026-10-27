'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAudio } from './AudioProvider';
import { parseLRC } from '@/lib/audio/timeFormat';

export const LyricsViewer: React.FC = () => {
  const { currentTrack, currentTime, seek, isLyricsOpen, setIsLyricsOpen } = useAudio();
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const parsedLyrics = useMemo(() => {
    if (!currentTrack?.lyrics) return [];
    return parseLRC(currentTrack.lyrics);
  }, [currentTrack?.lyrics]);

  // Find index of currently active line
  const activeIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, currentTime]);

  // Auto-scroll to current active line smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && isLyricsOpen) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isLyricsOpen]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-obsidian-sidebar border-l border-obsidian-border z-50 flex flex-col shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-obsidian-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-obsidian-accent" />
          <h3 className="text-sm font-semibold tracking-tightest text-obsidian-primary">
            Synchronized Lyrics
          </h3>
        </div>
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-1 rounded text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Track Title Info */}
      <div className="px-5 py-3 border-b border-obsidian-border/50 bg-obsidian-card/30">
        <div className="text-xs font-medium text-obsidian-primary truncate">
          {currentTrack?.title || 'No track selected'}
        </div>
        <div className="text-[11px] text-obsidian-secondary truncate">
          {currentTrack?.artist}
        </div>
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-12 space-y-7 scroll-smooth scrollbar-thin scrollbar-thumb-obsidian-border"
      >
        {parsedLyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-obsidian-secondary py-16">
            <Sparkles className="w-8 h-8 mb-3 opacity-30 text-obsidian-accent" />
            <p className="text-sm font-medium">No synced lyrics available for this track.</p>
            <p className="text-xs text-obsidian-secondary/70 mt-1">Enjoy the music & DSP audio graph.</p>
          </div>
        ) : (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                className={`cursor-pointer transition-all duration-300 font-sans tracking-tight leading-relaxed select-none ${
                  isActive
                    ? 'text-obsidian-primary font-bold text-xl scale-[1.02] origin-left drop-shadow-sm text-obsidian-primary'
                    : 'text-obsidian-secondary/50 text-base hover:text-obsidian-secondary font-normal'
                }`}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
