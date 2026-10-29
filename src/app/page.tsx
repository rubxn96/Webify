'use client';

import React, { useEffect, useState } from 'react';
import { HeroShelf } from '@/components/discovery/HeroShelf';
import { QuickAccessGrid } from '@/components/discovery/QuickAccessGrid';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';
import { Sparkles, Flame, Music2, Zap, Radio, Heart, History } from 'lucide-react';

interface DynamicRecommendationsData {
  hero: Track | null;
  quickAccess: Track[];
  vibeRecommendations?: Track[];
  recentVibeSeed?: { title: string; artist: string; summary?: string } | null;
  recentlyPlayed?: Track[];
  trendingIndia: Track[];
  latestHindi: Track[];
  trendingSouth: Track[];
  punjabiDesiHipHop?: Track[];
  acousticSoul?: Track[];
  userFavorites?: Track[];
}

const CACHE_KEY = 'webify_homepage_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export default function HomePage() {
  const [data, setData] = useState<DynamicRecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local session cache first to eliminate unnecessary network fetches
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed?.data) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore parse error
    }

    // 2. Fetch fresh recommendations on page load / browser refresh
    fetch('/api/recommendations')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) {
          setData(resData);
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: resData })
            );
          } catch {
            // ignore storage quota error
          }
        }
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
    ...(data.vibeRecommendations || []),
    ...(data.quickAccess || []),
    ...(data.trendingIndia || []),
    ...(data.latestHindi || []),
    ...(data.trendingSouth || []),
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* 1. Hero Shelf: Featured Spotlight (Latest Chartbuster) */}
      <HeroShelf heroTrack={data.hero} allTracks={allTracks} />

      {/* 2. Recommended for Your Vibe (Averaged across past listened tracks) */}
      {data.vibeRecommendations && data.vibeRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400 fill-purple-400/20" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Recommended for Your Vibe
              </h2>
              {data.recentVibeSeed && (
                <p className="text-xs text-white/50">
                  {data.recentVibeSeed.summary || `${data.recentVibeSeed.title} • ${data.recentVibeSeed.artist}`}
                </p>
              )}
            </div>
          </div>
          <CuratedRail title="" tracks={data.vibeRecommendations} />
        </div>
      )}

      {/* 3. Quick Access: Top Stations / Daily Picks */}
      <QuickAccessGrid tracks={data.quickAccess || []} />

      {/* 4. Recently Played (Past listened songs up to last 30 songs) */}
      {data.recentlyPlayed && data.recentlyPlayed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Recently Played
              </h2>
              <p className="text-xs text-white/50">
                Your past listened songs stored from this session (up to 30 tracks)
              </p>
            </div>
          </div>
          <CuratedRail title="" tracks={data.recentlyPlayed} />
        </div>
      )}

      {/* 5. Trending Now in India (Live Viral Chartbusters) */}
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

      {/* 6. Latest Hindi Hits (Bollywood & Desi Pop) */}
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

      {/* 7. South Wave (Tamil & Malayalam Chartbusters) */}
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

      {/* 8. Desi Hip-Hop & Punjabi Power */}
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

      {/* 9. Acoustic & Soulful Melodies */}
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

      {/* 10. User Saved Favorites (if available) */}
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
