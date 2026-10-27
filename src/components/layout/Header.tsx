'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, LogOut, Disc, Heart } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserProfile } from '@/types';
import Link from 'next/link';

export const Header: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-obsidian-border bg-obsidian-canvas/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-md w-full relative">
        <Search className="w-4 h-4 text-obsidian-secondary absolute left-3 top-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks, artists, ISRC or paste YouTube ID..."
          className="w-full bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-full pl-9 pr-4 py-1.5 text-xs text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none transition-all"
        />
      </form>

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
