'use client';

import React, { useEffect, useState } from 'react';
import { HeroShelf } from '@/components/discovery/HeroShelf';
import { QuickAccessGrid } from '@/components/discovery/QuickAccessGrid';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';

interface RecommendationsData {
  hero: Track | null;
  quickAccess: Track[];
  heavyRotation: Track[];
  discoveryMix: Track[];
  artistSpotlight: { artist: string; tracks: Track[] };
  jumpBackIn: Track[];
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
    ...(data.heavyRotation || []),
    ...(data.discoveryMix || []),
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Hero Shelf: Heavy Rotation */}
      <HeroShelf heroTrack={data.hero} allTracks={allTracks} />

      {/* 2. Quick Access Grid: 2x3 compact tiles */}
      <QuickAccessGrid tracks={data.quickAccess || []} />

      {/* 3. Curated Rail: Jump Back In */}
      <CuratedRail
        title="Jump Back In"
        subtitle="Resume your favorite high-fidelity listening sessions"
        tracks={data.jumpBackIn || []}
      />

      {/* 4. Curated Rail: Discovery Mix (Vector Cosine Similarity Engine) */}
      <CuratedRail
        title="Discovery Mix"
        subtitle="Curated by 8D vector cosine similarity & low familiarity weighting"
        tracks={data.discoveryMix || []}
        isVectorDiscovery
      />

      {/* 5. Curated Rail: Because you like [Top Artist] */}
      {data.artistSpotlight?.artist && data.artistSpotlight?.tracks?.length > 0 && (
        <CuratedRail
          title={`Because you like ${data.artistSpotlight.artist}`}
          subtitle="Acoustic features & spatial harmonics similar to your top listened artist"
          tracks={data.artistSpotlight.tracks}
        />
      )}
    </div>
  );
}

