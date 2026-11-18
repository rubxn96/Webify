'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

interface QuickAccessGridProps {
  tracks: Track[];
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ tracks }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();

  const displayTracks = tracks.slice(0, 6);
  if (displayTracks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
          Quick Access &amp; Daily Picks
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">
          Live Stations &amp; Dynamic Mix
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;

          const handleTileClick = () => {
            if (isCurrent) {
              togglePlay();
            } else {
              playTrack(track);
            }
          };

          return (
            <div
              key={track.id}
              onClick={handleTileClick}
              className={`group flex items-center justify-between bg-surface-container-low hover:bg-surface-container-high transition-all duration-300 rounded-2xl p-2 pr-4 cursor-pointer overflow-hidden shadow-sm hover:shadow-md border border-white/[0.04] ${
                isCurrent ? 'ring-1 ring-primary/60 bg-surface-container-high' : ''
              }`}
            >
              <div className="flex items-center gap-3.5 truncate flex-1 min-w-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-highest shadow-md">
                  <Image
                    src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                    alt={track.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="truncate pr-2">
                  <h4
                    className={`text-sm font-semibold tracking-tight truncate ${
                      isCurrent ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary transition-colors'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Action buttons on tile right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <TrackContextMenu track={track} />
                </div>

                {/* Emerald Play Button */}
                <div
                  className={`w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_16px_rgba(16,229,117,0.35)] transition-all ${
                    isCurrent
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 group-hover:opacity-100 group-hover:scale-105 translate-y-1 group-hover:translate-y-0'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-on-primary" />
                  ) : (
                    <Play className="w-4 h-4 fill-on-primary ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
