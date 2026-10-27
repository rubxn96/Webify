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
    'The Weeknd Blinding Lights',
    'Daft Punk Get Lucky',
    'Eminem Without Me',
    'Hans Zimmer Interstellar',
    'Coldplay Viva La Vida',
    'Lofi Hip Hop Beats',
  ];

  const youtubeCount = results.filter((t) => t.source === 'youtube').length;
  const catalogCount = results.filter((t) => t.source !== 'youtube').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Search Header Form */}
      <div className="max-w-3xl mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-5 h-5 text-obsidian-secondary absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube songs, paste video link (e.g. youtu.be/...), or catalog..."
            className="w-full bg-obsidian-card border border-obsidian-border focus:border-obsidian-accent rounded-xl pl-12 pr-28 py-3 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none transition-all shadow-lg"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 rounded-lg bg-obsidian-accent hover:bg-obsidian-accent-hover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-obsidian-secondary">
          <span className="font-mono text-[11px] text-obsidian-secondary/70">Popular:</span>
          {quickPicks.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => {
                setQuery(pick);
                performSearch(pick, activeFilter);
              }}
              className="px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-accent/60 hover:text-obsidian-primary text-[11px] transition-colors"
            >
              {pick}
            </button>
          ))}
        </div>

        {/* Source Filter Tabs */}
        {query.trim() && (
          <div className="flex items-center gap-2 pt-2 border-t border-obsidian-border/40">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-obsidian-card border-obsidian-accent text-obsidian-primary'
                  : 'bg-obsidian-sidebar border-obsidian-border text-obsidian-secondary hover:text-obsidian-primary'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Sources ({results.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('youtube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                activeFilter === 'youtube'
                  ? 'bg-red-500/15 border-red-500 text-red-400'
                  : 'bg-obsidian-sidebar border-obsidian-border text-obsidian-secondary hover:text-obsidian-primary'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>Live YouTube Stream ({youtubeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                activeFilter === 'catalog'
                  ? 'bg-obsidian-card border-obsidian-accent text-obsidian-accent'
                  : 'bg-obsidian-sidebar border-obsidian-border text-obsidian-secondary hover:text-obsidian-primary'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Stored Catalog ({catalogCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-obsidian-secondary font-mono">
            <span>
              Found {results.length} songs for &ldquo;{query}&rdquo; (
              {youtubeCount} from YouTube, {catalogCount} from Catalog)
            </span>
            <span className="text-emerald-400 font-semibold">Web Audio DSP Ready</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((track) => (
              <TrackCard key={track.id} track={track} playlistContext={results} />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="p-16 text-center text-obsidian-secondary space-y-2 bg-obsidian-card/40 border border-obsidian-border rounded-2xl max-w-xl mx-auto">
          <Music className="w-10 h-10 mx-auto text-obsidian-border" />
          <p className="text-sm font-medium text-obsidian-primary">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-obsidian-secondary">
            Try a different search term, artist name, or paste a direct YouTube video URL.
          </p>
        </div>
      ) : (
        <div className="p-16 text-center text-obsidian-secondary space-y-3 bg-obsidian-card/20 border border-obsidian-border rounded-2xl max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <Youtube className="w-6 h-6 fill-red-500" />
          </div>
          <h3 className="text-base font-semibold text-obsidian-primary">
            Search & Stream Anything from YouTube
          </h3>
          <p className="text-xs text-obsidian-secondary max-w-md mx-auto">
            Search any artist, song title, or music video across YouTube. Play directly with native 10-band DSP equalizer and loudness normalization.
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
