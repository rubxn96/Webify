'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Heart, Youtube, Disc, Loader2, Play, Menu, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { Track, UserProfile } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import Link from 'next/link';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const router = useRouter();
  const { playTrack } = useAudio();
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Live search preview state
  const [previewResults, setPreviewResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsProfileOpen(false);
      router.refresh();
    }
  };

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleProfileClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleProfileClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleProfileClickOutside);
  }, [isProfileOpen]);

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
    // Play with similar track generation (not raw duplicates)
    playTrack(track);
  };

  return (
    <header className="h-16 border-b border-white/[0.06] bg-obsidian-canvas/75 backdrop-blur-2xl px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30 gap-2 sm:gap-4 select-none">
      {/* Mobile Hamburger Menu Toggle */}
      <div className="flex items-center gap-2">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Open Menu & Playlists"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Brand Icon */}
        <Link href="/" className="lg:hidden flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-xl bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent flex items-center justify-center font-extrabold text-xs shadow-sm">
            W
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Webify</span>
        </Link>
      </div>

      {/* Live Search Input & Dropdown */}
      <div ref={dropdownRef} className="max-w-md w-full relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-obsidian-accent animate-spin absolute left-3.5 top-2.5" />
          ) : (
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-2.5" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (previewResults.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search songs, artists, or paste YouTube link..."
            className="w-full glass-pill rounded-full pl-9 pr-3 sm:pr-4 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-all"
          />
        </form>

        {/* Live Search Results Dropdown */}
        {isDropdownOpen && previewResults.length > 0 && (
          <div className="absolute top-11 inset-x-0 glass-panel rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fadeIn border border-white/10">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase text-white/40 border-b border-white/[0.06] pb-1.5">
              <span>Instant Matches</span>
              <span>{previewResults.length} found</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 py-1">
              {previewResults.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <div className="relative w-9 h-9 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0 shadow-sm">
                      <Image
                        src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-semibold text-white/95 group-hover:text-obsidian-accent truncate">
                        {track.title}
                      </div>
                      <div className="text-[11px] text-white/50 truncate">
                        {track.artist}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-white/40 tabular-nums hidden sm:inline">
                      {formatTime(track.duration)}
                    </span>
                    {track.source === 'youtube' ? (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400">
                        <Youtube className="w-2.5 h-2.5 fill-red-400" />
                        YouTube
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[9px] font-mono text-white/60">
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
              className="p-2 text-center text-xs text-obsidian-accent hover:underline cursor-pointer border-t border-white/[0.06] font-medium"
            >
              See all results for &ldquo;{query}&rdquo; &rarr;
            </div>
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          href="/favorites"
          className="p-2 text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Favorites / Liked Songs"
        >
          <Heart className="w-4 h-4 text-obsidian-accent fill-obsidian-accent" />
          <span className="hidden sm:inline">Favorites</span>
        </Link>

        {user ? (
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full glass-pill hover:bg-white/10 transition-all border border-white/10"
              title="User Account"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm flex-shrink-0">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left pr-1">
                <div className="text-xs font-semibold text-white tracking-tight truncate max-w-[120px]">
                  {user.username}
                </div>
                <div className="text-[10px] text-white/40">Obsidian Hi-Fi</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden md:block mr-1" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-12 w-56 glass-panel rounded-2xl shadow-2xl p-2 z-50 border border-white/10 space-y-1 animate-fadeIn backdrop-blur-3xl">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <div className="text-xs font-semibold text-white truncate">{user.username}</div>
                  <div className="text-[11px] text-white/40 truncate">{user.email}</div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-white/60" />
                  <span>Switch Account</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
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
