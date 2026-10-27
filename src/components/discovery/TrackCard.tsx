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
      playTrack(track, playlistContext);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-card p-3 rounded-2xl group cursor-pointer transition-all duration-300 flex flex-col justify-between ${
        isCurrent ? 'ring-1 ring-obsidian-accent/50 bg-white/[0.06]' : ''
      }`}
    >
      {/* Pristine Album Artwork */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.04] mb-2.5 shadow-md shadow-black/30">
        <Image
          src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
          alt={track.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover / Playing Glass Overlay */}
        <div
          className={`absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-105 active:scale-95">
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </div>
        </div>

        {/* Top Right Actions: Subtle Frosted Glass Heart + 3-Dot Menu */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track);
            }}
            className={`w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-200 ${
              isLiked
                ? 'opacity-100 text-obsidian-accent'
                : 'opacity-0 group-hover:opacity-100 text-white/90 hover:scale-110 hover:bg-black/60'
            }`}
            title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent' : ''}`} />
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
      <div className="px-0.5">
        <h4
          className={`text-sm font-semibold tracking-tight truncate ${
            isCurrent ? 'text-obsidian-accent' : 'text-white/95'
          }`}
        >
          {track.title}
        </h4>
        <p className="text-xs text-white/55 truncate mt-0.5 font-normal hover:text-white/80 transition-colors">
          {track.artist}
        </p>
      </div>
    </div>
  );
};
