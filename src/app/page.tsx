'use client';

import React, { useEffect, useState } from 'react';
import { HeroShelf } from '@/components/discovery/HeroShelf';
import { QuickAccessGrid } from '@/components/discovery/QuickAccessGrid';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';
import { Sparkles, Compass } from 'lucide-react';

interface RecommendationsData {
  hero: Track | null;
  quickAccess: Track[];
  aiRecommendations: Track[];
  historyBasedTracks: Track[];
  heavyRotation: Track[];
  discoveryMix: Track[];
  artistSpotlight: { artist: string; tracks: Track[] };
}

export default function HomePage() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch((err) => {
        console.error('Failed to load discovery rails:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <HomepageSkeleton />;
  }

  const allTracks = [
    ...(data.quickAccess || []),
    ...(data.aiRecommendations || []),
    ...(data.historyBasedTracks || []),
    ...(data.heavyRotation || []),
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* 1. Hero Shelf: Featured Spotlight */}
      <HeroShelf heroTrack={data.hero} allTracks={allTracks} />

      {/* 2. Made For You (Editorial Recommendations) */}
      {data.aiRecommendations && data.aiRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-obsidian-accent" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Made For You
            </h2>
          </div>
          <CuratedRail
            title=""
            tracks={data.aiRecommendations}
          />
        </div>
      )}

      {/* 3. Quick Access: Top Stations / Daily Picks */}
      <QuickAccessGrid tracks={data.quickAccess || []} />

      {/* 4. Based on Your Favorites & History */}
      {data.historyBasedTracks && data.historyBasedTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Based on Your Favorites
          </h2>
          <CuratedRail
            title=""
            tracks={data.historyBasedTracks}
          />
        </div>
      )}

      {/* 5. Curated Rail: Discovery Mix */}
      {data.discoveryMix && data.discoveryMix.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-white/70" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Discovery Station
            </h2>
          </div>
          <CuratedRail
            title=""
            tracks={data.discoveryMix}
          />
        </div>
      )}

      {/* 6. Artist Spotlight */}
      {data.artistSpotlight?.artist && data.artistSpotlight?.tracks?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            More Like {data.artistSpotlight.artist}
          </h2>
          <CuratedRail
            title=""
            tracks={data.artistSpotlight.tracks}
          />
        </div>
      )}
    </div>
  );
}
