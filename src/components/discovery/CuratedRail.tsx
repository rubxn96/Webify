'use client';

import React from 'react';
import { TrackCard } from './TrackCard';
import { Track } from '@/types';
import { Sparkles, Compass } from 'lucide-react';

interface CuratedRailProps {
  title: string;
  subtitle?: string;
  tracks: Track[];
  isVectorDiscovery?: boolean;
}

export const CuratedRail: React.FC<CuratedRailProps> = ({
  title,
  subtitle,
  tracks,
  isVectorDiscovery,
}) => {
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isVectorDiscovery && (
              <Compass className="w-4 h-4 text-obsidian-accent animate-spin-slow" />
            )}
            <h3 className="text-lg font-bold tracking-tightest text-obsidian-primary">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-obsidian-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} playlistContext={tracks} />
        ))}
      </div>
    </div>
  );
};

