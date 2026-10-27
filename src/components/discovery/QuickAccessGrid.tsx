'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';

interface QuickAccessGridProps {
  tracks: Track[];
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ tracks }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();

  const displayTracks = tracks.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-obsidian-secondary font-mono">
          Daily Top Picks &bull; Quick Access
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
              className={`group flex items-center justify-between bg-obsidian-card hover:bg-obsidian-hover border rounded-xl overflow-hidden cursor-pointer transition-all pr-4 ${
                isCurrent ? 'border-obsidian-accent shadow-sm' : 'border-obsidian-border'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate flex-1">
                <div className="relative w-16 h-16 flex-shrink-0 bg-obsidian-sidebar">
                  <Image
                    src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="truncate pr-2">
                  <h4
                    className={`text-sm font-semibold tracking-tightest truncate ${
                      isCurrent ? 'text-obsidian-accent' : 'text-obsidian-primary'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-obsidian-secondary truncate">{track.artist}</p>
                </div>
              </div>

              {/* Play Button on Hover/Active */}
              <div
                className={`w-9 h-9 rounded-full bg-obsidian-primary text-obsidian-canvas flex items-center justify-center shadow-md transition-all flex-shrink-0 ${
                  isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-105'
                }`}
              >
                {isCurrent && isPlaying ? (
                  <Pause className="w-4 h-4 fill-obsidian-canvas" />
                ) : (
                  <Play className="w-4 h-4 fill-obsidian-canvas ml-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

