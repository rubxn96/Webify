'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

interface HeroShelfProps {
  heroTrack: Track | null;
  allTracks: Track[];
}

export const HeroShelf: React.FC<HeroShelfProps> = ({ heroTrack, allTracks }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike } = useAudio();

  if (!heroTrack) return null;

  const isCurrent = currentTrack?.id === heroTrack.id || currentTrack?.youtubeId === heroTrack.youtubeId;
  const isLiked = likedTrackIds.has(heroTrack.id) || likedTrackIds.has(heroTrack.youtubeId);

  const handlePlayHero = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(heroTrack);
    }
  };

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10">
      {/* Blurred Ambient Glow from Track Artwork & Emerald Aura */}
      <div className="absolute right-0 top-0 bottom-0 w-3/4 opacity-25 pointer-events-none overflow-hidden blur-3xl scale-125">
        <Image
          src={heroTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
          alt={heroTrack.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand-primary/15 rounded-full blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Editorial Details */}
        <div className="space-y-4 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              Spotlight Release
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-pod border border-white/10 text-content-secondary text-xs font-mono">
              Lossless Master • FLAC
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white line-clamp-1">
              {heroTrack.title}
            </h1>
            <p className="text-base sm:text-lg text-content-secondary mt-1.5 font-medium">
              {heroTrack.artist} {heroTrack.album ? `— ${heroTrack.album}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handlePlayHero}
              className="px-8 py-3.5 rounded-full bg-brand-primary text-[#0A0A0A] font-bold text-sm flex items-center gap-2.5 shadow-[0_12px_32px_rgba(16,229,117,0.35)] hover:shadow-[0_16px_36px_rgba(16,229,117,0.5)] hover:scale-105 active:scale-95 transition-all"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-[#0A0A0A]" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#0A0A0A] ml-0.5" />
                  <span>Listen Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => toggleLike(heroTrack)}
              className={`w-11 h-11 rounded-full glass-pill flex items-center justify-center transition-all ${
                isLiked ? 'text-brand-primary border-brand-primary/40 bg-brand-primary/10' : 'text-white/80 hover:text-white'
              }`}
              title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-primary' : ''}`} />
            </button>

            <TrackContextMenu track={heroTrack} />
          </div>
        </div>

        {/* Right: Album Artwork with Liquid Glass Shadow */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/90 flex-shrink-0 group">
          <Image
            src={heroTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
            alt={heroTrack.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};

