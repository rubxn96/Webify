'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Library,
  Download,
  Plus,
  Disc3,
  Globe,
  Lock,
  X,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useAudio } from '@/components/audio/AudioProvider';
import { Playlist } from '@/types';
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchPlaylists = () => {
    fetch('/api/playlists')
      .then((res) => (res.ok ? res.json() : { playlists: [] }))
      .then((data) => {
        if (data?.playlists) setPlaylists(data.playlists);
        else setPlaylists([]);
      })
      .catch(() => setPlaylists([]));
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

      if (res.status === 401) {
        setIsAuthOpen(true);
        return;
      }

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
    { label: 'Recommendations', href: '/recommendations', icon: Sparkles },
    { label: 'Search', href: '/search', icon: Search },
  ];

  const libraryLinks = [
    { label: 'Your Library', href: '/library', icon: Library },
    { label: 'Import Playlist', href: '/import', icon: Download },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between glass-panel select-none border-r border-white/[0.06]">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand / Logo & Mobile Close */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary flex items-center justify-center shadow-[0_0_12px_rgba(16,229,117,0.25)]">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                WEBIFY
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/70 block -mt-1">
                Pulse Hi-Fi
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 scrollbar-thin">
          {/* Section: Discover */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_20px_rgba(16,229,117,0.25)]'
                      : 'text-content-secondary hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#0A0A0A]' : 'text-content-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section: Library */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Library
            </div>

            {/* Pinned Liked Songs / Favorites Folder */}
            <Link
              href="/favorites"
              onClick={() => onCloseMobile && onCloseMobile()}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
                pathname === '/favorites'
                  ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_20px_rgba(16,229,117,0.25)]'
                  : 'text-content-secondary hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${
                pathname === '/favorites' ? 'bg-[#0A0A0A] text-brand-primary' : 'bg-gradient-to-br from-brand-primary to-emerald-700 text-[#0A0A0A]'
              }`}>
                <Heart className={`w-3.5 h-3.5 fill-current`} />
              </div>
              <div className="truncate flex-1">
                <span>Liked Songs</span>
              </div>
              {likedTrackIds.size > 0 && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold tabular-nums ${
                  pathname === '/favorites'
                    ? 'bg-[#0A0A0A]/20 text-[#0A0A0A]'
                    : 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
                }`}>
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_20px_rgba(16,229,117,0.25)]'
                      : 'text-content-secondary hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#0A0A0A]' : 'text-content-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section: Playlists */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              <span>Playlists</span>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded-full hover:bg-white/10 text-content-muted hover:text-brand-primary transition-colors"
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
                  className="w-full glass-card rounded-full px-3 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
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
                    className={`flex items-center justify-between px-3.5 py-2 rounded-full text-xs truncate transition-all duration-200 ${
                      isCurrentPlaylist
                        ? 'bg-brand-primary/15 text-brand-primary font-bold border border-brand-primary/25'
                        : 'text-content-secondary hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate">{playlist.name}</span>
                    {playlist.isPublic ? (
                      <Globe className="w-3 h-3 text-content-muted flex-shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-content-muted flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
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
        onSuccess={() => {
          try {
            sessionStorage.removeItem('webify_homepage_cache');
            sessionStorage.removeItem('webify_recommendations_cache');
          } catch {
            // ignore
          }
          fetchPlaylists();
        }}
      />
    </>
  );
};
