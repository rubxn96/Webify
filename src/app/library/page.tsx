'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Library, Plus, Heart, Globe, Lock, Music2 } from 'lucide-react';
import { Playlist } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAudio } from '@/components/audio/AudioProvider';

export default function LibraryPage() {
  const { likedTrackIds } = useAudio();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const loadPlaylists = () => {
    fetch('/api/playlists')
      .then((res) => (res.ok ? res.json() : { playlists: [] }))
      .then((data) => {
        if (data.playlists) setPlaylists(data.playlists);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTitle.trim(), isPublic: true }),
      });

      if (res.ok) {
        setNewTitle('');
        setIsCreating(false);
        loadPlaylists();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl glass-pill text-obsidian-accent">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Your Library & Playlists
            </h1>
            <p className="text-xs text-white/50 mt-0.5">
              Curated audio collections, imported Spotify playlists & favorite tracks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Quick Create Modal / Inline */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 glass-panel rounded-2xl flex gap-3 max-w-md border border-white/10">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter playlist name..."
            className="flex-1 glass-card rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-1.5 rounded-xl glass-pill text-xs text-white/60 hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Playlist Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Permanent Liked Songs / Favorites Card */}
          <Link
            href="/favorites"
            className="group col-span-2 glass-card rounded-3xl p-6 bg-gradient-to-br from-rose-950/40 via-purple-950/20 to-white/[0.03] border border-rose-500/30 hover:border-rose-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden"
          >
            <div className="space-y-2 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-rose-300 transition-colors pt-2">
                Liked Songs
              </h3>
              <p className="text-xs text-white/60 line-clamp-2">
                Your automatically collected favorites from your listening sessions and live search.
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between relative z-10">
              <span className="text-xs font-mono font-semibold text-rose-400 tabular-nums">
                {likedTrackIds.size} Liked Tracks
              </span>
              <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4 fill-black" />
              </div>
            </div>
          </Link>

          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="group glass-card rounded-2xl p-3 border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.04] mb-3 shadow-md shadow-black/30">
                <Image
                  src={playlist.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                  alt={playlist.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90">
                  {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                </div>
              </div>

              <div className="px-0.5">
                <h4 className="text-sm font-semibold tracking-tight text-white/95 truncate group-hover:text-obsidian-accent transition-colors">
                  {playlist.name}
                </h4>
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {playlist.trackCount || playlist.tracks?.length || 0} tracks &bull; {playlist.isPublic ? 'Public' : 'Private'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

