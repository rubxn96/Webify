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
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';
import { Playlist, UserProfile } from '@/types';
import { AuthModal } from '@/components/auth/AuthModal';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (data?.user) setUser(data.user);
        else setUser(null);
      })
      .catch(() => {});
  };

  const handleSidebarLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      router.refresh();
    }
  };

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
    fetchUser();
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

  const discoverLinks = [
    { label: 'Listen Now', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
  ];

  const libraryLinks = [
    { label: 'Your Library', href: '/library', icon: Library },
    { label: 'Import Playlist', href: '/import', icon: Download },
  ];

  const dspLinks = [
    { label: 'DSP Equalizer', href: '/settings', icon: Sliders },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between glass-panel select-none border-r border-white/[0.06]">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand / Logo & Mobile Close */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent flex items-center justify-center shadow-sm">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                WEBIFY
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block -mt-1">
                Hi-Fi Audio
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 scrollbar-thin">
          {/* Section: Discover */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Discover
            </div>
            {discoverLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium tracking-tight transition-all ${
                    isActive
                      ? 'glass-pill bg-white/10 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-obsidian-accent' : 'text-white/60'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section: Library */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Library
            </div>

            {/* Pinned Liked Songs / Favorites Folder */}
            <Link
              href="/favorites"
              onClick={() => onCloseMobile && onCloseMobile()}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                pathname === '/favorites'
                  ? 'glass-pill bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="truncate flex-1">
                <span>Liked Songs</span>
              </div>
              {likedTrackIds.size > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20 tabular-nums">
                  {likedTrackIds.size}
                </span>
              )}
            </Link>

            {libraryLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium tracking-tight transition-all ${
                    isActive
                      ? 'glass-pill bg-white/10 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-obsidian-accent' : 'text-white/60'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section: Studio DSP */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Studio DSP
            </div>
            {dspLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium tracking-tight transition-all ${
                    isActive
                      ? 'glass-pill bg-white/10 text-white font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-obsidian-accent' : 'text-white/60'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section: Playlists */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              <span>Playlists</span>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Create Playlist"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Create Input */}
            {isCreating && (
              <form onSubmit={handleCreatePlaylist} className="px-3 py-1">
                <input
                  type="text"
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  onBlur={() => !newPlaylistName && setIsCreating(false)}
                  className="w-full glass-card rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-white/40 outline-none focus:border-obsidian-accent"
                />
              </form>
            )}

            {/* Playlists list */}
            <div className="space-y-0.5">
              {playlists.map((playlist) => {
                const isCurrentPlaylist = pathname === `/playlists/${playlist.id}`;
                return (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs truncate transition-all ${
                      isCurrentPlaylist
                        ? 'bg-white/10 text-obsidian-accent font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate">{playlist.name}</span>
                    {playlist.isPublic ? (
                      <Globe className="w-3 h-3 text-white/30 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Account / Log In / Log Out */}
      <div className="p-3 pb-0 border-t border-white/[0.06]">
        {user ? (
          <div className="p-2.5 rounded-2xl glass-card flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate mr-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-[10px] font-mono font-bold text-white flex-shrink-0 shadow-sm">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{user.username}</div>
                <div className="text-[10px] text-white/40 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleSidebarLogout}
              className="p-1.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="w-full py-2 px-3 rounded-2xl bg-white text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        )}
      </div>

      {/* DSP Baseline Glass Badge */}
      <div className="p-3">
        <div className="p-2.5 rounded-xl glass-card text-[11px] font-mono text-white/60">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">DSP Normalizer</span>
            <span className="text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              Active
            </span>
          </div>
          <div className="text-[10px] text-white/40 mt-1">
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </>
  );
};
