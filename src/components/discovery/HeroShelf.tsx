'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Flame, Heart } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';

interface HeroShelfProps {
  heroTrack: Track | null;
  allTracks: Track[];
}

export const HeroShelf: React.FC<HeroShelfProps> = ({ heroTrack, allTracks }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike } = useAudio();

  if (!heroTrack) return null;

  const isCurrent = currentTrack?.id === heroTrack.id || currentTrack?.youtubeId === heroTrack.youtubeId;
  const isLiked = likedTrackIds.has(heroTrack.id);

  const handlePlayHero = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(heroTrack, allTracks);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-obsidian-border bg-gradient-to-r from-obsidian-card via-obsidian-card/90 to-obsidian-card/40 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      {/* Background glow art */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none overflow-hidden blur-2xl">
        <Image
          src={heroTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
          alt={heroTrack.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Info */}
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent text-xs font-mono font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Heavy Rotation &bull; Spotlight</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tightest text-obsidian-primary line-clamp-1">
              {heroTrack.title}
            </h1>
            <p className="text-sm sm:text-base text-obsidian-secondary mt-1 font-medium">
              {heroTrack.artist} &bull; {heroTrack.album || 'Single'} &bull;{' '}
              <span className="font-mono text-xs">{formatTime(heroTrack.duration)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayHero}
              className="px-6 py-3 rounded-full bg-obsidian-primary hover:bg-white text-obsidian-canvas font-semibold text-sm flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-obsidian-canvas" />
                  <span>Pause Playback</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-obsidian-canvas ml-0.5" />
                  <span>Play Session</span>
                </>
              )}
            </button>

            <button
              onClick={() => toggleLike(heroTrack)}
              className={`p-3 rounded-full border border-obsidian-border bg-obsidian-sidebar hover:bg-obsidian-hover transition-colors ${
                isLiked ? 'text-obsidian-accent' : 'text-obsidian-secondary hover:text-obsidian-primary'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-obsidian-accent' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Artwork */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-xl overflow-hidden border border-obsidian-border shadow-2xl flex-shrink-0 group">
          <Image
            src={heroTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
            alt={heroTrack.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};
