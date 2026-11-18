'use client';

import React, { useEffect, useState } from 'react';
import { CuratedRail } from '@/components/discovery/CuratedRail';
import { ArtistCard } from '@/components/discovery/ArtistCard';
import { AITasteProfileCard } from '@/components/discovery/AITasteProfileCard';
import { HomepageSkeleton } from '@/components/ui/Skeleton';
import { Track, DiscoveryRecommendationsResponse } from '@/types';
import {
  Sparkles,
  Flame,
  Radio,
  Disc,
  Play,
  Heart,
  Globe,
  Compass,
  Zap,
  Music2,
  Calendar,
  Gem,
  Headphones,
} from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';
import Image from 'next/image';

const CACHE_KEY = 'webify_recommendations_full_cache';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes local cache

const INDIAN_LANGUAGES = [
  { id: 'hindi', label: 'Hindi' },
  { id: 'malayalam', label: 'Malayalam' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'kannada', label: 'Kannada' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'marathi', label: 'Marathi' },
];

export default function DiscoverPage() {
  const [data, setData] = useState<DiscoveryRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('malayalam');
  const { playTrack } = useAudio();

  const fetchRecommendations = () => {
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
        console.error('Failed to load discovery feed:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 1. Check local session cache
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

    // 2. Fetch fresh recommendations
    fetchRecommendations();
  }, []);

  if (loading || !data) {
    return <HomepageSkeleton />;
  }

  const handlePlayQueue = (tracks: Track[]) => {
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks, true);
    }
  };

  const trendingLanguageTracks =
    data.trendingInYourLanguages?.[selectedLanguage] ||
    data.trendingInYourLanguages?.['hindi'] ||
    data.trendingIndia ||
    [];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-28 animate-fadeIn select-none">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-card via-surface-cardElevated to-surface-pod border border-white/10 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-10 w-96 h-96 bg-brand-primary/10 rounded-full blur-[110px] pointer-events-none -z-0" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid Neural Discovery Engine</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Discover &amp; For You
            </h1>

            <p className="text-xs sm:text-sm text-content-secondary">
              Personalized recommendations synthesizing content similarity, collaborative filtering,
              and real-time listening history across Indian regional languages.
            </p>
          </div>

          {data.madeForYou && data.madeForYou.length > 0 && (
            <button
              onClick={() => handlePlayQueue(data.madeForYou)}
              className="px-8 py-3.5 rounded-full bg-brand-primary text-[#0A0A0A] font-bold text-xs flex items-center gap-2.5 shadow-[0_12px_32px_rgba(16,229,117,0.35)] hover:shadow-[0_16px_36px_rgba(16,229,117,0.5)] active:scale-95 transition-all flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-[#0A0A0A] ml-0.5" />
              <span>Play Your Mix</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Acoustic Taste Profile Card */}
      {data.aiTasteProfile && (
        <AITasteProfileCard profile={data.aiTasteProfile} />
      )}

      {/* 1. Made For You */}
      {data.madeForYou && data.madeForYou.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl glass-pill text-brand-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Made For You
                </h2>
                <p className="text-xs text-content-muted">
                  Calculated with 40% content similarity, 30% collaborative graph, and 20% taste persona.
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayQueue(data.madeForYou)}
              className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Play All</span> &rarr;
            </button>
          </div>
          <CuratedRail title="" tracks={data.madeForYou} />
        </div>
      )}

      {/* 2. Recommended For You */}
      {data.recommendedForYou && data.recommendedForYou.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl glass-pill text-brand-primary">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Recommended For You
                </h2>
                <p className="text-xs text-content-muted">
                  Fine-tuned to your audio attributes, mood vectors, and listening duration.
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayQueue(data.recommendedForYou)}
              className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Play All</span> &rarr;
            </button>
          </div>
          <CuratedRail title="" tracks={data.recommendedForYou} />
        </div>
      )}

      {/* 3. Because You Listened To... */}
      {data.becauseYouListenedTo && data.becauseYouListenedTo.tracks.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 truncate">
              <div className="relative w-12 h-12 rounded-2xl bg-white/[0.04] overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                <Image
                  src={
                    data.becauseYouListenedTo.seed.thumbnail ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'
                  }
                  alt={data.becauseYouListenedTo.seed.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-mono text-purple-400 font-semibold uppercase tracking-wider">
                  Because You Listened To
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {data.becauseYouListenedTo.seed.title}{' '}
                  <span className="text-xs font-normal text-white/50">
                    &bull; {data.becauseYouListenedTo.seed.artist}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayQueue(data.becauseYouListenedTo!.tracks)}
              className="px-4 py-2 rounded-full glass-pill text-xs font-semibold text-white/90 hover:text-white flex items-center gap-2 flex-shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Play Station</span>
            </button>
          </div>

          <CuratedRail title="" tracks={data.becauseYouListenedTo.tracks} />
        </div>
      )}

      {/* 4. Similar Songs */}
      {data.similarSongs && data.similarSongs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl glass-pill text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Similar Songs
              </h2>
              <p className="text-xs text-white/50">
                Acoustic harmony, tempo alignment, and shared sonic profiles.
              </p>
            </div>
          </div>
          <CuratedRail title="" tracks={data.similarSongs} />
        </div>
      )}

      {/* 5. Discover New Artists */}
      {data.discoverNewArtists && data.discoverNewArtists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl glass-pill text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Discover New Artists
              </h2>
              <p className="text-xs text-white/50">
                Talented Indian creators and independent musicians you haven&apos;t listened to yet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.discoverNewArtists.map((artistItem) => (
              <ArtistCard key={artistItem.artist} artistData={artistItem} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Trending in India */}
      {data.trendingIndia && data.trendingIndia.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl glass-pill text-rose-500">
                <Flame className="w-5 h-5 fill-rose-500/20" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Trending in India
                </h2>
                <p className="text-xs text-white/50">
                  National viral chartbusters based on play velocity and listener engagement.
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayQueue(data.trendingIndia)}
              className="text-xs text-rose-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Play All</span> &rarr;
            </button>
          </div>
          <CuratedRail title="" tracks={data.trendingIndia} />
        </div>
      )}

      {/* 7. Trending in Your Languages */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl glass-pill text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Trending in Your Languages
              </h2>
              <p className="text-xs text-white/50">
                Explore authentic regional chartbusters across India.
              </p>
            </div>
          </div>

          {/* Language Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-pod/90 border border-white/10 overflow-x-auto scrollbar-none">
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.3)]'
                      : 'text-content-secondary hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        <CuratedRail title="" tracks={trendingLanguageTracks} />
      </div>

      {/* 8. Recently Released */}
      {data.recentlyReleased && data.recentlyReleased.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl glass-pill text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Recently Released
              </h2>
              <p className="text-xs text-white/50">
                Fresh drops and singles released within the last 120 days.
              </p>
            </div>
          </div>
          <CuratedRail title="" tracks={data.recentlyReleased} />
        </div>
      )}

      {/* 9. Hidden Gems */}
      {data.hiddenGems && data.hiddenGems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl glass-pill text-amber-400">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Hidden Gems &amp; Underrated Tracks
              </h2>
              <p className="text-xs text-white/50">
                Exceptional listener completion rates and heartfelt acoustic, indie &amp; folk gems.
              </p>
            </div>
          </div>
          <CuratedRail title="" tracks={data.hiddenGems} />
        </div>
      )}

      {/* 10. Your Daily Mix */}
      {data.dailyMix && data.dailyMix.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl glass-pill text-fuchsia-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Your Daily Mix
                </h2>
                <p className="text-xs text-white/50">
                  40% familiar favorites, 40% personalized recommendations, and 20% fresh discoveries.
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayQueue(data.dailyMix)}
              className="text-xs text-fuchsia-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Play All</span> &rarr;
            </button>
          </div>
          <CuratedRail title="" tracks={data.dailyMix} />
        </div>
      )}
    </div>
  );
}
