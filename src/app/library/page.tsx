'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Library, Plus, Heart, Globe, Lock, Music2 } from 'lucide-react';
import { Playlist } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LibraryPage() {
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
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-accent">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tightest text-obsidian-primary">
              Your Library & Playlists
            </h1>
            <p className="text-xs text-obsidian-secondary mt-0.5">
              Curated audio collections, imported Spotify playlists & favorite tracks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-lg bg-obsidian-accent hover:bg-obsidian-accent-hover text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Quick Create Modal / Inline */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 bg-obsidian-card border border-obsidian-border rounded-xl flex gap-3 max-w-md">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter playlist name..."
            className="flex-1 bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-lg px-3 py-1.5 text-xs text-obsidian-primary outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-obsidian-accent text-white text-xs font-medium hover:bg-obsidian-accent-hover transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-1.5 rounded-lg border border-obsidian-border text-xs text-obsidian-secondary hover:text-obsidian-primary"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Playlist Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="group bg-obsidian-card hover:bg-obsidian-hover border border-obsidian-border rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-obsidian-sidebar mb-3">
                <Image
                  src={playlist.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                  alt={playlist.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 p-1 rounded bg-black/60 backdrop-blur-sm text-obsidian-primary">
                  {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-tightest text-obsidian-primary truncate group-hover:text-obsidian-accent transition-colors">
                  {playlist.name}
                </h4>
                <p className="text-xs text-obsidian-secondary truncate mt-0.5">
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

