'use client';

import React, { useEffect, useState } from 'react';
import { HeroShelf } from '@/components/discovery/HeroShelf';
import { QuickAccessGrid } from '@/components/discovery/QuickAccessGrid';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { AITasteProfileCard } from '@/components/discovery/AITasteProfileCard';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track, AITasteProfile } from '@/types';
import { Sparkles, History } from 'lucide-react';

interface RecommendationsData {
  hero: Track | null;
  quickAccess: Track[];
  aiRecommendations: Track[];
  historyBasedTracks: Track[];
  heavyRotation: Track[];
  discoveryMix: Track[];
  artistSpotlight: { artist: string; tracks: Track[] };
  aiTasteProfile: AITasteProfile;
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
    <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Hero Shelf: Heavy Rotation */}
      <HeroShelf heroTrack={data.hero} allTracks={allTracks} />

      {/* 2. AI Neural Taste Profile Banner */}
      {data.aiTasteProfile && (
        <AITasteProfileCard profile={data.aiTasteProfile} />
      )}

      {/* 3. AI Recommended For You (Multi-Factor Acoustic Scoring) */}
      {data.aiRecommendations && data.aiRecommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-obsidian-accent animate-pulse" />
            <h2 className="text-lg font-bold tracking-tightest text-obsidian-primary">
              AI Recommended For You
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent">
              Cosine Similarity AI
            </span>
          </div>
          <p className="text-xs text-obsidian-secondary">
            Fresh unlistened tracks scored against your personal acoustic centroid and harmonic preference.
          </p>

          <CuratedRail
            title=""
            tracks={data.aiRecommendations}
          />
        </div>
      )}

      {/* 4. Based on Your Listening History */}
      {data.historyBasedTracks && data.historyBasedTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tightest text-obsidian-primary">
              Based on Your Listening History
            </h2>
          </div>
          <p className="text-xs text-obsidian-secondary">
            Fresh discoveries matching the artists and genres from your completed listening sessions.
          </p>

          <CuratedRail
            title=""
            tracks={data.historyBasedTracks}
          />
        </div>
      )}

      {/* 5. Quick Access Grid: 2x3 compact tiles */}
      <QuickAccessGrid tracks={data.quickAccess || []} />

      {/* 6. Curated Rail: Discovery Mix */}
      <CuratedRail
        title="Discovery Mix"
        subtitle="Curated by 8D vector cosine similarity & low familiarity weighting"
        tracks={data.discoveryMix || []}
        isVectorDiscovery
      />

      {/* 7. Curated Rail: Because you like [Top Artist] */}
      {data.artistSpotlight?.artist && data.artistSpotlight?.tracks?.length > 0 && (
        <CuratedRail
          title={`Because you like ${data.artistSpotlight.artist}`}
          subtitle="Harmonic resonance and rhythmic features matching your top artist"
          tracks={data.artistSpotlight.tracks}
        />
      )}
    </div>
  );
}
