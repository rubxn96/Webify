'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track } from '@/types';
import { Sparkles, History, Flame, Compass, Play } from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';

interface RecommendationsData {
  vibeRecommendations?: Track[];
  recentVibeSeed?: { title: string; artist: string } | null;
  recentlyPlayed?: Track[];
  trendingIndia?: Track[];
  latestHindi?: Track[];
  trendingSouth?: Track[];
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentTrack, playTrack } = useAudio();

  const fetchRecommendations = useCallback(() => {
    fetch('/api/recommendations')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch((err) => {
        console.error('Failed to load recommendations:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Dynamically refresh whenever a new song plays
  useEffect(() => {
    if (!currentTrack?.id) return;
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentTrack?.id, fetchRecommendations]);

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
                  Tuned to your recent listen &ldquo;<span className="text-purple-300 font-medium">{data.recentVibeSeed.title}</span>&rdquo; by {data.recentVibeSeed.artist}. Continuously updated each session from your database history.
                </>
              ) : (
                'Play any song to calibrate your session vibe in real time. We match similar melodic, acoustic, and rhythm vibes.'
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
                  Similar to &ldquo;{data.recentVibeSeed.title}&rdquo; &bull; Filtered for genuine chartbusters
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

      {/* 2. Recently Played (Past 20 songs stored in database) */}
      {data.recentlyPlayed && data.recentlyPlayed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Recently Played (Past 20 Songs)
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
