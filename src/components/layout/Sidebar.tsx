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
  Heart,
  Globe,
  Lock,
} from 'lucide-react';
import { Playlist } from '@/types';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <aside className="w-60 bg-obsidian-sidebar border-r border-obsidian-border flex flex-col justify-between h-full select-none flex-shrink-0 z-20">
      <div className="flex flex-col h-full">
        {/* Brand / Logo */}
        <div className="p-6 pb-5 flex items-center gap-3">
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

        {/* Primary Navigation */}
        <nav className="px-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
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

        {/* Divider */}
        <div className="mx-4 my-4 border-t border-obsidian-border" />

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
    </aside>
  );
};
