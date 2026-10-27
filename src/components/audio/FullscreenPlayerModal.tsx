'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  ListMusic,
  Sliders,
} from 'lucide-react';
import { useAudio } from './AudioProvider';
import { formatTime, parseLRC } from '@/lib/audio/timeFormat';
import Link from 'next/link';

export const FullscreenPlayerModal: React.FC = () => {
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
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    visualizerData,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics'>('visualizer');

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const parsedLyrics = parseLRC(currentTrack.lyrics || '');

  const activeLyricIndex = parsedLyrics.findIndex((line, i) => {
    const nextLine = parsedLyrics[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-canvas/98 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-12 overflow-hidden animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-obsidian-accent animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian-secondary">
            Obsidian High-Fidelity Audio
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-obsidian-card border border-obsidian-border rounded-full p-1 text-xs">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-1 rounded-full transition-all ${
              activeTab === 'visualizer'
                ? 'bg-obsidian-hover text-obsidian-primary font-medium'
                : 'text-obsidian-secondary hover:text-obsidian-primary'
            }`}
          >
            Artwork & DSP
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'bg-obsidian-hover text-obsidian-primary font-medium'
                : 'text-obsidian-secondary hover:text-obsidian-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-obsidian-accent" />
            Synced Lyrics
          </button>
        </div>

        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full flex items-center justify-center my-6">
        {activeTab === 'visualizer' ? (
          <div className="flex flex-col items-center max-w-md w-full">
            {/* Artwork Card */}
            <div className="relative w-72 h-72 md:w-88 md:h-88 rounded-2xl overflow-hidden border border-obsidian-border shadow-2xl group bg-obsidian-card">
              <Image
                src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
                alt={currentTrack.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Real-time Web Audio Visualizer Bars */}
            <div className="flex items-end justify-center gap-1.5 h-12 w-full mt-6 px-4">
              {Array.from({ length: 24 }).map((_, i) => {
                const val = visualizerData[i] || 10;
                const heightPercent = Math.max(8, (val / 255) * 100);
                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-obsidian-accent to-rose-400 transition-all duration-75"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Lyrics Mode */
          <div className="w-full max-w-2xl h-[420px] overflow-y-auto space-y-6 text-center px-4 py-8 scroll-smooth scrollbar-thin">
            {parsedLyrics.length === 0 ? (
              <div className="h-full flex items-center justify-center text-obsidian-secondary">
                No synchronized lyrics available for this track.
              </div>
            ) : (
              parsedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => seek(line.time)}
                    className={`cursor-pointer transition-all duration-300 font-sans tracking-tight ${
                      isActive
                        ? 'text-obsidian-primary font-bold text-2xl md:text-3xl scale-105'
                        : 'text-obsidian-secondary/40 text-lg hover:text-obsidian-secondary'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* Track Details & Like */}
        <div className="flex items-center justify-between">
          <div className="truncate pr-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tightest text-obsidian-primary truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm md:text-base text-obsidian-secondary truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>
          <button
            onClick={() => toggleLike(currentTrack)}
            className="p-2 text-obsidian-secondary hover:text-obsidian-primary transition-transform active:scale-125"
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked ? 'fill-obsidian-accent text-obsidian-accent' : ''
              }`}
            />
          </button>
        </div>

        {/* Scrub Bar */}
        <div>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * duration);
            }}
            className="h-2 w-full bg-obsidian-card border border-obsidian-border rounded-full cursor-pointer relative overflow-hidden"
          >
            <div
              className="h-full bg-obsidian-accent rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-obsidian-secondary mt-1.5">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Controls Button Row */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/settings"
            onClick={() => setIsFullPlayerOpen(false)}
            className="p-2 text-obsidian-secondary hover:text-obsidian-primary transition-colors"
            title="DSP Equalizer"
          >
            <Sliders className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-6">
            <button
              onClick={prevTrack}
              className="text-obsidian-secondary hover:text-obsidian-primary transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-obsidian-primary text-obsidian-canvas flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-obsidian-canvas" />
              ) : (
                <Play className="w-6 h-6 fill-obsidian-canvas ml-1" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-obsidian-secondary hover:text-obsidian-primary transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-obsidian-secondary hover:text-obsidian-primary"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-obsidian-accent bg-obsidian-card rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
