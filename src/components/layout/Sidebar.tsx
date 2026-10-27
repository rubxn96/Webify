'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Library,
  Sliders,
  Download,
  Plus,
  Disc3,
  Globe,
  Lock,
  X,
  Heart,
} from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';
import { Playlist } from '@/types';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { likedTrackIds } = useAudio();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const fetchPlaylists = () => {
    fetch('/api/playlists')
      .then((res) => (res.ok ? res.json() : { playlists: [] }))
      .then((data) => {
        if (data.playlists) setPlaylists(data.playlists);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPlaylists();
  }, [pathname]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim(), isPublic: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewPlaylistName('');
        setIsCreating(false);
        fetchPlaylists();
        if (data.playlist?.id) {
          router.push(`/playlists/${data.playlist.id}`);
          if (onCloseMobile) onCloseMobile();
        }
      }
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Your Library', href: '/library', icon: Library },
    { label: 'Import Playlist', href: '/import', icon: Download },
    { label: 'DSP Equalizer', href: '/settings', icon: Sliders },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-obsidian-sidebar select-none">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand / Logo & Mobile Close */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent flex items-center justify-center">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tightest text-obsidian-primary block">
                OBSIDIAN
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-obsidian-secondary block -mt-1">
                Hi-Fi Audio
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-tightest transition-all ${
                  isActive
                    ? 'bg-obsidian-card text-obsidian-primary border border-obsidian-border font-semibold shadow-sm'
                    : 'text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-obsidian-accent' : 'text-obsidian-secondary'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pinned Liked Songs / Favorites Folder */}
        <div className="px-3 pt-2">
          <Link
            href="/favorites"
            onClick={() => onCloseMobile && onCloseMobile()}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-tightest transition-all ${
              pathname === '/favorites'
                ? 'bg-gradient-to-r from-rose-950/60 to-obsidian-card text-obsidian-primary border border-rose-500/30 shadow-md'
                : 'text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover/50'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="truncate flex-1">
              <span>Liked Songs</span>
            </div>
            {likedTrackIds.size > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20">
                {likedTrackIds.size}
              </span>
            )}
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-obsidian-border" />

        {/* Playlists Shelf */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2">
          <div className="flex items-center justify-between px-2 text-[11px] font-mono uppercase tracking-wider text-obsidian-secondary font-semibold">
            <span>Playlists</span>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 rounded hover:bg-obsidian-hover text-obsidian-secondary hover:text-obsidian-primary transition-colors"
              title="Create Playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Create Input */}
          {isCreating && (
            <form onSubmit={handleCreatePlaylist} className="px-2 py-1">
              <input
                type="text"
                autoFocus
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                onBlur={() => !newPlaylistName && setIsCreating(false)}
                className="w-full bg-obsidian-card border border-obsidian-accent rounded px-2.5 py-1 text-xs text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none"
              />
            </form>
          )}

          {/* User & Curated Playlists */}
          <div className="space-y-0.5">
            {playlists.map((playlist) => {
              const isCurrentPlaylist = pathname === `/playlists/${playlist.id}`;
              return (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs truncate transition-all ${
                    isCurrentPlaylist
                      ? 'bg-obsidian-card text-obsidian-accent font-medium'
                      : 'text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover/40'
                  }`}
                >
                  <span className="truncate">{playlist.name}</span>
                  {playlist.isPublic ? (
                    <Globe className="w-3 h-3 text-obsidian-secondary/40 flex-shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-obsidian-secondary/40 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* DSP Baseline Badge */}
      <div className="p-4 border-t border-obsidian-border bg-obsidian-sidebar/60">
        <div className="p-2.5 rounded-lg bg-obsidian-card/70 border border-obsidian-border text-[11px] font-mono text-obsidian-secondary">
          <div className="flex items-center justify-between">
            <span className="text-obsidian-primary font-medium">DSP Engine</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="text-[10px] text-obsidian-secondary mt-0.5">
            -14 LUFS &bull; 10-Band EQ
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile/tablet screens) */}
      <aside className="hidden lg:flex w-60 border-r border-obsidian-border flex-col justify-between h-full flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl border-r border-obsidian-border z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
