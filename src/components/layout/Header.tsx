'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Heart, Youtube, Disc, Loader2, Play } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { Track, UserProfile } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import Link from 'next/link';

export const Header: React.FC = () => {
  const router = useRouter();
  const { playTrack } = useAudio();
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Live search preview state
  const [previewResults, setPreviewResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Debounced live search preview as user types
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!query.trim()) {
      setPreviewResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setPreviewResults(data.tracks || []);
          setIsDropdownOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsDropdownOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setIsDropdownOpen(false);
    // Sync to DB
    if (track.source === 'youtube') {
      fetch('/api/tracks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnail: track.thumbnail,
        }),
      }).catch(() => {});
    }
    playTrack(track, previewResults);
  };

  return (
    <header className="h-16 border-b border-obsidian-border bg-obsidian-canvas/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Live Search Input & Dropdown */}
      <div ref={dropdownRef} className="max-w-md w-full relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-obsidian-accent animate-spin absolute left-3.5 top-2.5" />
          ) : (
            <Search className="w-4 h-4 text-obsidian-secondary absolute left-3.5 top-2.5" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (previewResults.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search YouTube songs, paste video URL or catalog..."
            className="w-full bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-full pl-10 pr-4 py-1.5 text-xs text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none transition-all"
          />
        </form>

        {/* Live Search Results Dropdown */}
        {isDropdownOpen && previewResults.length > 0 && (
          <div className="absolute top-11 inset-x-0 bg-obsidian-card border border-obsidian-border rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fadeIn">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase text-obsidian-secondary border-b border-obsidian-border/50 pb-1.5">
              <span>Instant YouTube & Catalog Matches</span>
              <span>{previewResults.length} found</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 py-1">
              {previewResults.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-obsidian-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <div className="relative w-8 h-8 rounded bg-obsidian-sidebar overflow-hidden flex-shrink-0">
                      <Image
                        src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-3 h-3 text-obsidian-primary fill-obsidian-primary" />
                      </div>
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-medium text-obsidian-primary group-hover:text-obsidian-accent truncate">
                        {track.title}
                      </div>
                      <div className="text-[11px] text-obsidian-secondary truncate">
                        {track.artist}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-obsidian-secondary">
                      {formatTime(track.duration)}
                    </span>
                    {track.source === 'youtube' ? (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400">
                        <Youtube className="w-2.5 h-2.5 fill-red-400" />
                        YouTube
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-obsidian-sidebar border border-obsidian-border text-[9px] font-mono text-obsidian-secondary">
                        <Disc className="w-2.5 h-2.5 text-obsidian-accent" />
                        Catalog
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              onClick={() => {
                setIsDropdownOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="p-2 text-center text-xs text-obsidian-accent hover:underline cursor-pointer border-t border-obsidian-border/50 font-medium"
            >
              See all results for &ldquo;{query}&rdquo; &rarr;
            </div>
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/library"
          className="p-2 text-obsidian-secondary hover:text-obsidian-primary transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Heart className="w-4 h-4 text-obsidian-accent" />
          <span className="hidden sm:inline">Favorites</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-obsidian-border">
            <div className="w-8 h-8 rounded-full bg-obsidian-hover border border-obsidian-border flex items-center justify-center text-xs font-mono font-bold text-obsidian-primary">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-obsidian-primary tracking-tightest">
                {user.username}
              </div>
              <div className="text-[10px] text-obsidian-secondary">Obsidian Hi-Fi</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-4 py-1.5 rounded-full bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border text-obsidian-primary text-xs font-medium transition-all"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </header>
  );
};
