'use client';

import React, { useState } from 'react';
import { TrackCard } from './TrackCard';
import { Track } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (tracks.length === 0) return null;

  const displayTracks = isExpanded ? tracks : tracks.slice(0, 12);

  return (
    <div className="space-y-4">
      {(title || tracks.length > 12) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-xl font-bold tracking-tight text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            )}
          </div>

          {tracks.length > 12 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="glass-pill flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-all"
            >
              <span>{isExpanded ? 'Show Less' : `Show All (${tracks.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayTracks.map((track) => (
          <TrackCard key={track.id} track={track} playlistContext={tracks} />
        ))}
      </div>
    </div>
  );
};

