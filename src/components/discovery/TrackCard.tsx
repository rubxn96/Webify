'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';

interface TrackCardProps {
  track: Track;
  playlistContext?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, playlistContext }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike } = useAudio();

  const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;
  const isLiked = likedTrackIds.has(track.id);

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Artwork */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-obsidian-sidebar mb-3">
        <Image
          src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
          alt={track.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover / Active Play Button Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-11 h-11 rounded-full bg-obsidian-primary text-obsidian-canvas flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-obsidian-canvas" />
            ) : (
              <Play className="w-5 h-5 fill-obsidian-canvas ml-0.5" />
            )}
          </div>
        </div>

        {/* Like Button on Artwork Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-all duration-150 ${
            isLiked ? 'opacity-100 text-obsidian-accent' : 'opacity-0 group-hover:opacity-100 text-white hover:scale-110'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent' : ''}`} />
        </button>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-obsidian-primary">
          {formatTime(track.duration)}
        </div>
      </div>

      {/* Track Metadata */}
      <div>
        <h4
          className={`text-sm font-semibold tracking-tightest truncate ${
            isCurrent ? 'text-obsidian-accent' : 'text-obsidian-primary'
          }`}
        >
          {track.title}
        </h4>
        <p className="text-xs text-obsidian-secondary truncate mt-0.5">{track.artist}</p>
      </div>
    </div>
  );
};
