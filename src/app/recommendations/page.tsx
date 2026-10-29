'use client';

import React, { useEffect, useState } from 'react';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';
import { Sparkles, History, Flame, Compass, Play } from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';

interface RecommendationsData {
  vibeRecommendations?: Track[];
  recentVibeSeed?: { title: string; artist: string; summary?: string } | null;
  recentlyPlayed?: Track[];
  trendingIndia?: Track[];
  latestHindi?: Track[];
  trendingSouth?: Track[];
}

const CACHE_KEY = 'webify_recommendations_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudio();

  useEffect(() => {
    // 1. Check local session cache first
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
      // ignore
    }

    // 2. Fetch fresh recommendations on page load
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
            // ignore
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load recommendations:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <HomepageSkeleton />;
  }

  const handlePlayAllVibe = () => {
    if (data.vibeRecommendations && data.vibeRecommendations.length > 0) {
      playTrack(data.vibeRecommendations[0], data.vibeRecommendations, true);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-black/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Vibe Engine
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Personalized Recommendations
            </h1>
            <p className="text-sm text-white/60 max-w-2xl">
              {data.recentVibeSeed ? (
                <>
                  Tuned to your average session vibe &ldquo;<span className="text-purple-300 font-medium">{data.recentVibeSeed.title}</span>&rdquo;. Averaged across your past listening history (up to last 30 songs).
                </>
              ) : (
                'Play tracks from the trending charts below to build your session listening history. We will curate a personalized vibe queue for you.'
              )}
            </p>
          </div>

          {data.vibeRecommendations && data.vibeRecommendations.length > 0 && (
            <button
              onClick={handlePlayAllVibe}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Play Vibe Queue
            </button>
          )}
        </div>
      </div>

      {/* 1. Recommended for Your Vibe */}
      {data.vibeRecommendations && data.vibeRecommendations.length > 0 ? (
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
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/50">
          <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
          <p className="text-sm font-medium text-white/70">No listening history in this session yet</p>
          <p className="text-xs text-white/40 mt-1">Play any track from the trending charts below to unlock personalized vibe recommendations!</p>
        </div>
      )}

      {/* 2. Recently Played (Past listened songs up to last 30 songs) */}
      {data.recentlyPlayed && data.recentlyPlayed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Recently Played (Last 30 Songs)
              </h2>
              <p className="text-xs text-white/50">
                Preserved across your session in PostgreSQL database
              </p>
            </div>
          </div>
          <CuratedRail title="" tracks={data.recentlyPlayed} />
        </div>
      )}

      {/* 3. Trending in India */}
      {data.trendingIndia && data.trendingIndia.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Trending in India
            </h2>
          </div>
          <CuratedRail title="" tracks={data.trendingIndia} />
        </div>
      )}
    </div>
  );
}
