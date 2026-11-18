'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
  Sparkles,
  Shuffle,
} from 'lucide-react';
import { useAudio } from './AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    likedTrackIds,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    isShuffle,
    toggleShuffle,
    setVolume,
    toggleMute,
    toggleLike,
    setIsLyricsOpen,
    isLyricsOpen,
    setIsQueueOpen,
    isQueueOpen,
    setIsFullPlayerOpen,
  } = useAudio();

  const [isHoveringScrub, setIsHoveringScrub] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) {
    return null;
  }

  const isLiked = likedTrackIds.has(currentTrack.id) || likedTrackIds.has(currentTrack.youtubeId);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(newRatio * duration);
  };

  return (
    <div className="glass-panel fixed bottom-14 lg:bottom-0 inset-x-0 h-16 sm:h-20 border-t border-white/[0.08] z-40 select-none shadow-2xl backdrop-blur-3xl">
      {/* 2.5px Scrub Bar on Top Border */}
      <div
        ref={progressBarRef}
        onClick={handleScrubClick}
        onMouseEnter={() => setIsHoveringScrub(true)}
        onMouseLeave={() => setIsHoveringScrub(false)}
        className="group relative -top-[1px] h-[3px] hover:h-[5px] w-full bg-white/[0.08] cursor-pointer transition-all duration-150"
      >
        <div
          className="h-full bg-brand-primary relative transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(16,229,117,0.7)]"
          style={{ width: `${progressPercent}%` }}
        >
          <span
            className={`absolute right-0 -top-1 w-2.5 h-2.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(111,255,154,0.9)] transition-opacity ${
              isHoveringScrub ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-[55%] sm:max-w-[32%]">
          <div
            onClick={() => setIsFullPlayerOpen(true)}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-surface-pod border border-white/10 overflow-hidden flex-shrink-0 cursor-pointer group shadow-md shadow-black/40"
          >
            <Image
              src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
              alt={currentTrack.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="truncate">
            <div
              onClick={() => setIsFullPlayerOpen(true)}
              className="text-white text-xs sm:text-sm font-semibold tracking-tight truncate hover:text-brand-primary hover:underline cursor-pointer transition-colors"
            >
              {currentTrack.title}
            </div>
            <div className="text-content-secondary text-[11px] sm:text-xs truncate mt-0.5">
              {currentTrack.artist}
            </div>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
            className="p-1.5 text-content-muted hover:text-white transition-colors flex-shrink-0"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isLiked ? 'fill-brand-primary text-brand-primary' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Timecodes */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={toggleShuffle}
              title={isShuffle ? 'Shuffle Mode On' : 'Shuffle Mode Off'}
              className={`p-1.5 rounded-full transition-colors hidden sm:block ${
                isShuffle
                  ? 'text-brand-primary bg-brand-primary/15'
                  : 'text-content-muted hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={prevTrack}
              title="Previous"
              className="text-white/60 hover:text-white transition-colors p-1 hidden sm:block"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-primary text-[#0A0A0A] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(16,229,117,0.35)] hover:shadow-[0_6px_24px_rgba(16,229,117,0.5)]"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-[#0A0A0A]" />
              ) : (
                <Play className="w-4 h-4 fill-[#0A0A0A] ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next Track"
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-content-muted font-mono tracking-tight mt-1">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </span>
            <span className="text-white/20">/</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="flex items-center gap-1 sm:gap-2.5 justify-end flex-shrink-0">
          {/* Synchronized Lyrics Toggle */}
          <button
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            title="Lyrics"
            className={`p-2 rounded-full glass-pill transition-all ${
              isLyricsOpen
                ? 'text-brand-primary border-brand-primary/40 bg-brand-primary/10 shadow-[0_0_12px_rgba(16,229,117,0.25)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Queue Drawer Toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            title="Queue"
            className={`p-2 rounded-full glass-pill transition-all ${
              isQueueOpen
                ? 'text-brand-primary border-brand-primary/40 bg-brand-primary/10 shadow-[0_0_12px_rgba(16,229,117,0.25)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Desktop Volume Slider */}
          <div className="hidden md:flex items-center gap-2 group ml-1">
            <button
              onClick={toggleMute}
              className="text-white/60 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-18 h-1 accent-brand-primary bg-white/15 rounded-full cursor-pointer"
            />
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsFullPlayerOpen(true)}
            title="Expand Full Player"
            className="p-2 rounded-full glass-pill text-white/60 hover:text-white hover:text-brand-primary transition-all ml-0.5"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
