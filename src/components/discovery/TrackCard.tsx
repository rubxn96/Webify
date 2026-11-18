'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

interface TrackCardProps {
  track: Track;
  playlistContext?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, playlistContext }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike } = useAudio();

  const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;
  const isLiked = likedTrackIds.has(track.id) || likedTrackIds.has(track.youtubeId);

  const handleCardClick = () => {
    // Sync track to DB in background if it's from YouTube
    if (track.source === 'youtube') {
      fetch('/api/tracks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnail: track.thumbnail,
        }),
      }).catch(() => {});
    }

    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-all duration-300 cursor-pointer border border-white/[0.04] ${
        isCurrent ? 'ring-1 ring-primary/60 bg-surface-container-high' : ''
      }`}
    >
      {/* Pristine Album Artwork */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-container-highest mb-2.5 shadow-md">
        <Image
          src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
          alt={track.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover / Playing Signature Bottom-Right Play Button */}
        <button
          type="button"
          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center transition-all duration-200 shadow-[0_4px_12px_rgba(16,229,117,0.4)] ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:scale-105 active:scale-95'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-on-primary" />
          ) : (
            <Play className="w-5 h-5 fill-on-primary ml-0.5" />
          )}
        </button>

        {/* Top Right Actions: Frosted Glass Heart + 3-Dot Menu */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track);
            }}
            className={`w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-200 ${
              isLiked
                ? 'opacity-100 text-primary'
                : 'opacity-0 group-hover:opacity-100 text-white/90 hover:scale-110 hover:bg-black/70'
            }`}
            title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-primary' : ''}`} />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className={`transition-opacity duration-200 ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <TrackContextMenu track={track} />
          </div>
        </div>
      </div>

      {/* Clean Track Metadata */}
      <div className="px-0.5 flex flex-col justify-between flex-1">
        <div>
          <h4
            className={`text-sm font-semibold tracking-tight truncate transition-colors ${
              isCurrent ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'
            }`}
          >
            {track.title}
          </h4>
          <p className="text-xs text-on-surface-variant truncate mt-0.5 font-normal">
            {track.artist}
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-outline mt-2 pt-1 border-t border-white/[0.04]">
          <span className="capitalize">{track.source || 'Web Audio'}</span>
          <span>FLAC Lossless</span>
        </div>
      </div>
    </div>
  );
};
