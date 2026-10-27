'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  Sliders,
  ListMusic,
  Maximize2,
  Sparkles,
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

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(newRatio * duration);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 h-20 bg-obsidian-sidebar border-t border-obsidian-border z-40 select-none shadow-2xl backdrop-blur-md">
      {/* 2px Scrub Bar on Top Border */}
      <div
        ref={progressBarRef}
        onClick={handleScrubClick}
        onMouseEnter={() => setIsHoveringScrub(true)}
        onMouseLeave={() => setIsHoveringScrub(false)}
        className="group relative -top-[1px] h-[3px] hover:h-[5px] w-full bg-obsidian-border cursor-pointer transition-all duration-150"
      >
        <div
          className="h-full bg-obsidian-accent relative transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        >
          <span
            className={`absolute right-0 -top-1 w-2.5 h-2.5 bg-obsidian-primary rounded-full shadow transition-opacity ${
              isHoveringScrub ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-3.5 min-w-[220px] max-w-[30%]">
          <div
            onClick={() => setIsFullPlayerOpen(true)}
            className="relative w-12 h-12 rounded bg-obsidian-card border border-obsidian-border overflow-hidden flex-shrink-0 cursor-pointer group"
          >
            <Image
              src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
              alt={currentTrack.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-obsidian-primary" />
            </div>
          </div>

          <div className="truncate">
            <div
              onClick={() => setIsFullPlayerOpen(true)}
              className="text-obsidian-primary text-sm font-medium tracking-tightest truncate hover:underline cursor-pointer"
            >
              {currentTrack.title}
            </div>
            <div className="text-obsidian-secondary text-xs truncate">
              {currentTrack.artist}
            </div>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
            className="p-1.5 text-obsidian-secondary hover:text-obsidian-primary transition-colors flex-shrink-0"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isLiked ? 'fill-obsidian-accent text-obsidian-accent' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Timecodes */}
        <div className="flex flex-col items-center max-w-[420px] w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={prevTrack}
              title="Previous"
              className="text-obsidian-secondary hover:text-obsidian-primary transition-colors p-1"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full bg-obsidian-primary text-obsidian-canvas flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-obsidian-canvas" />
              ) : (
                <Play className="w-4 h-4 fill-obsidian-canvas ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next"
              className="text-obsidian-secondary hover:text-obsidian-primary transition-colors p-1"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-obsidian-secondary font-mono tracking-tight mt-1">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </span>
            <span className="text-obsidian-border">/</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          {/* Synchronized Lyrics Toggle */}
          <button
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            title="Lyrics"
            className={`p-1.5 rounded transition-colors ${
              isLyricsOpen
                ? 'text-obsidian-accent bg-obsidian-hover'
                : 'text-obsidian-secondary hover:text-obsidian-primary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Equalizer Link */}
          <Link
            href="/settings"
            title="DSP Equalizer & Settings"
            className="p-1.5 rounded text-obsidian-secondary hover:text-obsidian-primary transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </Link>

          {/* Queue Drawer Toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            title="Queue"
            className={`p-1.5 rounded transition-colors ${
              isQueueOpen
                ? 'text-obsidian-accent bg-obsidian-hover'
                : 'text-obsidian-secondary hover:text-obsidian-primary'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-obsidian-secondary hover:text-obsidian-primary transition-colors"
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
              className="w-16 h-1 accent-obsidian-accent bg-obsidian-card rounded cursor-pointer"
            />
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsFullPlayerOpen(true)}
            title="Expand Full Player"
            className="p-1.5 text-obsidian-secondary hover:text-obsidian-primary transition-colors ml-1"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
