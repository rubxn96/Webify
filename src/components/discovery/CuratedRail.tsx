'use client';

import React, { useState } from 'react';
import { TrackCard } from './TrackCard';
import { Track } from '@/types';
import { Sparkles, Compass, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  if (tracks.length === 0) return null;

  const displayTracks = isExpanded ? tracks : tracks.slice(0, 12);

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
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-secondary">
              {tracks.length} Songs
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-obsidian-secondary mt-0.5">{subtitle}</p>
          )}
        </div>

        {tracks.length > 12 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-obsidian-secondary hover:text-obsidian-primary px-2.5 py-1 rounded-lg bg-obsidian-card border border-obsidian-border transition-colors"
          >
            <span>{isExpanded ? 'Show Less' : `Show All (${tracks.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayTracks.map((track) => (
          <TrackCard key={track.id} track={track} playlistContext={tracks} />
        ))}
      </div>
    </div>
  );
};

