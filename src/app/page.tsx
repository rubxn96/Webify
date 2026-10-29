'use client';

import React, { useEffect, useState } from 'react';
import { HeroShelf } from '@/components/discovery/HeroShelf';
import { QuickAccessGrid } from '@/components/discovery/QuickAccessGrid';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';
import { Sparkles, Flame, Music2, Zap, Radio, Heart } from 'lucide-react';

interface DynamicRecommendationsData {
  hero: Track | null;
  quickAccess: Track[];
  trendingIndia: Track[];
  latestHindi: Track[];
  trendingSouth: Track[];
  punjabiDesiHipHop?: Track[];
  acousticSoul?: Track[];
  userFavorites?: Track[];
}

export default function HomePage() {
  const [data, setData] = useState<DynamicRecommendationsData | null>(null);
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
    ...(data.trendingIndia || []),
    ...(data.latestHindi || []),
    ...(data.trendingSouth || []),
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* 1. Hero Shelf: Featured Spotlight (Latest Chartbuster) */}
      <HeroShelf heroTrack={data.hero} allTracks={allTracks} />

      {/* 2. Trending Now in India (Live Viral Chartbusters) */}
      {data.trendingIndia && data.trendingIndia.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Trending in India
            </h2>
          </div>
          <p className="text-xs text-white/50 -mt-2">
            Live viral chartbusters updated continuously across Indian streams.
          </p>
          <CuratedRail title="" tracks={data.trendingIndia} />
        </div>
      )}

      {/* 3. Quick Access: Top Stations / Daily Picks */}
      <QuickAccessGrid tracks={data.quickAccess || []} />

      {/* 4. Latest Hindi Hits (Bollywood & Desi Pop) */}
      {data.latestHindi && data.latestHindi.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-obsidian-accent" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Latest Hindi Hits
            </h2>
          </div>
          <p className="text-xs text-white/50 -mt-2">
            Top Bollywood soundtracks, romantic melodies & trending Hindi singles.
          </p>
          <CuratedRail title="" tracks={data.latestHindi} />
        </div>
      )}

      {/* 5. South Wave (Tamil & Malayalam Chartbusters) */}
      {data.trendingSouth && data.trendingSouth.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              South Wave: Tamil &amp; Malayalam
            </h2>
          </div>
          <p className="text-xs text-white/50 -mt-2">
            High-octane Kollywood anthems, viral Mollywood beats & melodic masterpieces.
          </p>
          <CuratedRail title="" tracks={data.trendingSouth} />
        </div>
      )}

      {/* 6. Desi Hip-Hop & Punjabi Power */}
      {data.punjabiDesiHipHop && data.punjabiDesiHipHop.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Punjabi &amp; Desi Hip-Hop
            </h2>
          </div>
          <p className="text-xs text-white/50 -mt-2">
            Pumping basslines, Punjabi bangers & cutting-edge Indian underground rap.
          </p>
          <CuratedRail title="" tracks={data.punjabiDesiHipHop} />
        </div>
      )}

      {/* 7. Acoustic & Soulful Melodies */}
      {data.acousticSoul && data.acousticSoul.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400/20" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Soulful Melodies &amp; Indie Unplugged
            </h2>
          </div>
          <p className="text-xs text-white/50 -mt-2">
            Intimate acoustic chords, serene vocals & heartwarming Indian indie gems.
          </p>
          <CuratedRail title="" tracks={data.acousticSoul} />
        </div>
      )}

      {/* 8. User Saved Favorites (if available) */}
      {data.userFavorites && data.userFavorites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-obsidian-accent" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Based on Your Favorites
            </h2>
          </div>
          <CuratedRail title="" tracks={data.userFavorites} />
        </div>
      )}
    </div>
  );
}
