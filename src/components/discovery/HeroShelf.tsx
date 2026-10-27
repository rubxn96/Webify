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
      playTrack(heroTrack, allTracks);
    }
  };

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl">
      {/* Blurred Ambient Glow from Track Artwork */}
      <div className="absolute right-0 top-0 bottom-0 w-3/4 opacity-30 pointer-events-none overflow-hidden blur-3xl scale-125">
        <Image
          src={heroTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
          alt={heroTrack.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Editorial Details */}
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-white/90 text-xs font-semibold uppercase tracking-wider">
            <span>Spotlight Release</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white line-clamp-1">
              {heroTrack.title}
            </h1>
            <p className="text-base sm:text-lg text-white/70 mt-1.5 font-medium">
              {heroTrack.artist} {heroTrack.album ? `— ${heroTrack.album}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handlePlayHero}
              className="px-7 py-3.5 rounded-full bg-white text-black font-semibold text-sm flex items-center gap-2.5 shadow-2xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-black" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                  <span>Listen Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => toggleLike(heroTrack)}
              className={`w-11 h-11 rounded-full glass-pill flex items-center justify-center transition-all ${
                isLiked ? 'text-obsidian-accent' : 'text-white/80 hover:text-white'
              }`}
              title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-obsidian-accent' : ''}`} />
            </button>

            <TrackContextMenu track={heroTrack} />
          </div>
        </div>

        {/* Right: Album Artwork with Liquid Glass Shadow */}
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 flex-shrink-0 group">
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

