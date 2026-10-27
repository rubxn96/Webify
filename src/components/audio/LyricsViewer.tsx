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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] glass-panel border-l border-white/[0.08] z-50 flex flex-col shadow-2xl backdrop-blur-3xl select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-obsidian-accent" />
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Lyrics
          </h3>
        </div>
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-1.5 rounded-full glass-pill text-white/60 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Track Title Info */}
      <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="text-xs font-semibold text-white truncate">
          {currentTrack?.title || 'No track selected'}
        </div>
        <div className="text-[11px] text-white/50 truncate mt-0.5">
          {currentTrack?.artist}
        </div>
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-10 pb-36 lg:pb-12 space-y-7 scroll-smooth scrollbar-thin"
      >
        {parsedLyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 py-16">
            <Sparkles className="w-8 h-8 mb-3 opacity-30 text-obsidian-accent" />
            <p className="text-sm font-medium">No synced lyrics available for this track.</p>
          </div>
        ) : (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                className={`cursor-pointer transition-all duration-300 font-bold tracking-tight leading-relaxed select-none ${
                  isActive
                    ? 'text-white font-extrabold text-2xl scale-[1.02] origin-left drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    : 'text-white/30 text-lg hover:text-white/60 font-semibold'
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

