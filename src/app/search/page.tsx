'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Music, Disc } from 'lucide-react';
import { Track } from '@/types';
import { TrackCard } from '@/components/discovery/TrackCard';
import { Skeleton } from '@/components/ui/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
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
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Search Header Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-2">
        <div className="relative">
          <Search className="w-5 h-5 text-obsidian-secondary absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog, YouTube songs, ISRC, or artists..."
            className="w-full bg-obsidian-card border border-obsidian-border focus:border-obsidian-accent rounded-xl pl-12 pr-4 py-3 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none transition-all shadow-lg"
          />
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-obsidian-secondary font-mono">
            <span>
              Found {results.length} results for &ldquo;{query}&rdquo;
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((track) => (
              <TrackCard key={track.id} track={track} playlistContext={results} />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="p-16 text-center text-obsidian-secondary space-y-2">
          <Music className="w-10 h-10 mx-auto text-obsidian-border" />
          <p className="text-sm font-medium">No direct catalog matches found.</p>
          <p className="text-xs text-obsidian-secondary/70">
            Try searching by exact artist or song title.
          </p>
        </div>
      ) : (
        <div className="p-16 text-center text-obsidian-secondary space-y-2">
          <Disc className="w-10 h-10 mx-auto text-obsidian-accent/40" />
          <p className="text-sm font-medium">Explore millions of ad-free tracks with high-fidelity Web Audio.</p>
          <p className="text-xs text-obsidian-secondary/70">
            Type any song name, artist, or ISRC code above to stream instantly.
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
