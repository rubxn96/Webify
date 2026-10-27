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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight text-white">
          Quick Picks
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;

          const handleTileClick = () => {
            if (isCurrent) {
              togglePlay();
            } else {
              playTrack(track, tracks);
            }
          };

          return (
            <div
              key={track.id}
              onClick={handleTileClick}
              className={`glass-card group flex items-center justify-between rounded-2xl p-2 pr-3.5 cursor-pointer transition-all duration-200 ${
                isCurrent ? 'ring-1 ring-obsidian-accent/50 bg-white/[0.08]' : ''
              }`}
            >
              <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.04] shadow-md shadow-black/30">
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
                      isCurrent ? 'text-obsidian-accent' : 'text-white/95'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-white/55 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Action buttons on tile right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <TrackContextMenu track={track} />
                </div>

                {/* Glass Play Button */}
                <div
                  className={`w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-all ${
                    isCurrent
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 group-hover:scale-105'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black ml-0.5" />
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
