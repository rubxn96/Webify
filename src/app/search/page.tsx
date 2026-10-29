'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Music, Disc, Youtube, Sparkles, Filter, Globe } from 'lucide-react';
import { Track } from '@/types';
import { TrackCard } from '@/components/discovery/TrackCard';
import { Skeleton } from '@/components/ui/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'youtube' | 'catalog'>('all');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (q: string, filter: 'all' | 'youtube' | 'catalog' = activeFilter) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&source=${filter}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, activeFilter);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, activeFilter);
  };

  const handleFilterChange = (filter: 'all' | 'youtube' | 'catalog') => {
    setActiveFilter(filter);
    if (query.trim()) {
      performSearch(query, filter);
    }
  };

  const quickPicks = [
    'Kesariya Arijit Singh',
    'Illuminati Aavesham',
    'Tauba Tauba Karan Aujla',
    'Hukum Anirudh Jailer',
    'Katchi Sera Sai Abhyankkar',
    'Darshana Hridayam',
  ];

  const youtubeCount = results.filter((t) => t.source === 'youtube').length;
  const catalogCount = results.filter((t) => t.source !== 'youtube').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Search Header Form */}
      <div className="max-w-3xl mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-5 h-5 text-white/40 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, or paste YouTube link..."
            className="w-full glass-pill rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-all shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-md"
          >
            Search
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/50">
          <span className="font-mono text-[11px] text-white/40">Trending:</span>
          {quickPicks.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => {
                setQuery(pick);
                performSearch(pick, activeFilter);
              }}
              className="px-3 py-1 rounded-full glass-pill text-[11px] text-white/70 hover:text-white transition-all"
            >
              {pick}
            </button>
          ))}
        </div>

        {/* Source Filter Tabs */}
        {query.trim() && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white/20 text-white font-semibold border border-white/20'
                  : 'glass-pill text-white/60 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Sources ({results.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('youtube')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'youtube'
                  ? 'bg-red-500/20 text-red-400 font-semibold border border-red-500/30'
                  : 'glass-pill text-white/60 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>YouTube Stream ({youtubeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('catalog')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'catalog'
                  ? 'bg-white/20 text-white font-semibold border border-white/20'
                  : 'glass-pill text-white/60 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Catalog ({catalogCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 font-mono">
            <span>
              Found {results.length} songs for &ldquo;{query}&rdquo;
            </span>
            <span className="text-emerald-400 font-semibold">Web Audio DSP Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((track) => (
              <TrackCard key={track.id} track={track} playlistContext={results} />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="p-16 text-center text-white/50 space-y-2 glass-panel border border-white/10 rounded-3xl max-w-xl mx-auto shadow-xl">
          <Music className="w-10 h-10 mx-auto text-white/20" />
          <p className="text-sm font-semibold text-white">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-white/50">
            Try a different search term, artist name, or paste a direct YouTube video URL.
          </p>
        </div>
      ) : (
        <div className="p-16 text-center text-white/50 space-y-3 glass-panel border border-white/10 rounded-3xl max-w-2xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <Youtube className="w-6 h-6 fill-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Search & Stream Live Audio from YouTube
          </h3>
          <p className="text-xs text-white/60 max-w-md mx-auto">
            Search any artist or song title across YouTube. Play directly with native 10-band DSP equalizer and loudness normalization.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-obsidian-secondary">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
