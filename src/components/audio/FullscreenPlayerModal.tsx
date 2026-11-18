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
  ChevronDown,
  ListMusic,
  Trash2,
  Shuffle,
} from 'lucide-react';
import { useAudio } from './AudioProvider';
import { formatTime, parseLRC } from '@/lib/audio/timeFormat';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

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
    queue,
    queueIndex,
    removeFromQueue,
    playTrack,
    isShuffle,
    toggleShuffle,
    shuffleQueue,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'queue'>('visualizer');

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id) || likedTrackIds.has(currentTrack.youtubeId);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const parsedLyrics = parseLRC(currentTrack.lyrics || '');

  const activeLyricIndex = parsedLyrics.findIndex((line, i) => {
    const nextLine = parsedLyrics[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-hidden animate-fadeIn select-none">
      {/* Liquid Ambient Blurred Backdrops */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-brand-primary/18 blur-[130px] animate-liquid" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-emerald-700/15 blur-[140px] animate-liquid" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[25%] left-[25%] w-[45vw] h-[45vw] rounded-full bg-brand-primary/10 blur-[120px] animate-liquid" style={{ animationDelay: '8s' }} />
      </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full gap-2 relative z-10">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2.5 rounded-full glass-pill text-white/70 hover:text-white transition-all flex items-center gap-1.5"
          title="Minimize Player"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Minimize</span>
        </button>

        {/* Segmented Glass Pill Switcher */}
        <div className="flex items-center glass-pill rounded-full p-1 text-xs">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'visualizer'
                ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.3)]'
                : 'text-content-secondary hover:text-white'
            }`}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.3)]'
                : 'text-content-secondary hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.3)]'
                : 'text-content-secondary hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Queue ({queue.length})
          </button>
        </div>

        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2.5 rounded-full glass-pill text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex items-center justify-center my-3 sm:my-6 overflow-hidden relative z-10">
        {activeTab === 'visualizer' ? (
          <div className="flex flex-col items-center max-w-md w-full">
            {/* Artwork Card with Ambient Glow */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-92 md:h-92 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/90 group bg-surface-pod">
              <Image
                src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
                alt={currentTrack.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Lossless Audio Spectrum Badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 shadow-lg text-brand-primary font-mono text-[10px] font-bold">
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-brand-primary rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.6s' }} />
                  <span className="w-0.5 bg-brand-primary rounded-full animate-bounce" style={{ height: '60%', animationDuration: '0.8s' }} />
                  <span className="w-0.5 bg-brand-primary rounded-full animate-bounce" style={{ height: '85%', animationDuration: '0.5s' }} />
                  <span className="w-0.5 bg-brand-primary rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.9s' }} />
                </span>
                <span className="text-white tracking-wider">LOSSLESS FLAC</span>
              </div>
            </div>

            {/* Real-time Web Audio Visualizer Bars */}
            <div className="flex items-end justify-center gap-1.5 h-10 sm:h-12 w-full mt-6 px-4">
              {Array.from({ length: 24 }).map((_, i) => {
                const val = visualizerData[i] || 10;
                const heightPercent = Math.max(8, (val / 255) * 100);
                return (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-brand-primary via-emerald-400 to-white/90 transition-all duration-75 shadow-[0_0_8px_rgba(16,229,117,0.5)]"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
          </div>
        ) : activeTab === 'lyrics' ? (
          /* Apple Music Style Synchronized Lyrics Mode */
          <div className="w-full max-w-2xl h-[340px] sm:h-[440px] overflow-y-auto space-y-7 text-center px-4 py-8 scroll-smooth scrollbar-thin">
            {parsedLyrics.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/50 text-sm">
                No synchronized lyrics available for this track.
              </div>
            ) : (
              parsedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => seek(line.time)}
                    className={`cursor-pointer transition-all duration-300 font-bold tracking-tight select-none ${
                      isActive
                        ? 'text-brand-primary text-2xl sm:text-3xl md:text-4xl scale-105 drop-shadow-[0_0_24px_rgba(16,229,117,0.4)]'
                        : 'text-white/25 text-lg sm:text-xl md:text-2xl hover:text-white/60'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Dynamic Queue Mode */
          <div className="w-full max-w-2xl h-[340px] sm:h-[440px] overflow-y-auto space-y-2 text-left px-3 sm:px-5 py-4 scroll-smooth scrollbar-thin glass-card rounded-2xl border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs text-content-muted font-mono">
              <div className="flex items-center gap-2">
                <span>Playing Next</span>
                <span className="text-brand-primary font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                  {queue.length} Tracks
                </span>
              </div>
              <button
                onClick={shuffleQueue}
                disabled={queue.length <= 1}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-30 active:scale-95 transition-all"
                title="Shuffle Queue"
              >
                <Shuffle className="w-3.5 h-3.5 text-brand-primary" />
                <span>Shuffle</span>
              </button>
            </div>

            {queue.map((t, idx) => {
              const isCurrent = currentTrack?.id === t.id || idx === queueIndex;
              return (
                <div
                  key={`${t.id}-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-brand-primary/15 text-white font-semibold shadow-sm border border-brand-primary/25'
                      : 'hover:bg-white/[0.05] text-white/60 hover:text-white'
                  }`}
                >
                  <div
                    onClick={() => playTrack(t)}
                    className="flex items-center gap-3 cursor-pointer flex-1 truncate mr-2"
                  >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-surface-pod flex-shrink-0 shadow-sm">
                      <Image
                        src={t.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                        alt={t.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="truncate flex-1">
                      <div
                        className={`text-xs truncate ${
                          isCurrent ? 'font-bold text-brand-primary' : 'font-medium text-white'
                        }`}
                      >
                        {t.title}
                      </div>
                      <div className="text-[11px] text-content-secondary truncate mt-0.5">{t.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-content-muted tabular-nums">
                      {formatTime(t.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      title="Remove from queue"
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <TrackContextMenu track={t} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="max-w-xl mx-auto w-full space-y-4 relative z-10">
        {/* Track Details & Like */}
        <div className="flex items-center justify-between">
          <div className="truncate pr-4">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm sm:text-base text-content-secondary truncate mt-0.5 font-normal">
              {currentTrack.artist}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleLike(currentTrack)}
              className="p-2.5 rounded-full glass-pill text-white/60 hover:text-white transition-all active:scale-125 flex-shrink-0"
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isLiked ? 'fill-brand-primary text-brand-primary' : ''
                }`}
              />
            </button>
            <TrackContextMenu track={currentTrack} />
          </div>
        </div>

        {/* Scrub Bar */}
        <div>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * duration);
            }}
            className="h-2 w-full bg-white/[0.08] hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
          >
            <div
              className="h-full bg-brand-primary rounded-full shadow-[0_0_10px_rgba(16,229,117,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-content-muted mt-1.5">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Controls Button Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-2.5 rounded-full glass-pill transition-colors ${
                isShuffle
                  ? 'text-brand-primary bg-brand-primary/15 border border-brand-primary/30'
                  : 'text-white/60 hover:text-white'
              }`}
              title={isShuffle ? 'Shuffle Mode On' : 'Shuffle Mode Off'}
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={prevTrack}
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-primary text-[#0A0A0A] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_12px_32px_rgba(16,229,117,0.35)] hover:shadow-[0_16px_36px_rgba(16,229,117,0.5)]"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-[#0A0A0A]" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-[#0A0A0A] ml-1" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next Track"
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Volume Control (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white/60 hover:text-white"
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
              className="w-18 h-1 accent-brand-primary bg-white/20 rounded-full cursor-pointer"
            />
          </div>

          <div className="sm:hidden w-8" />
        </div>
      </div>
    </div>
  );
};
