'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Check, Music, FolderPlus, Loader2 } from 'lucide-react';
import { Playlist, Track } from '@/types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ isOpen, track, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/playlists')
      .then((res) => (res.ok ? res.json() : { playlists: [] }))
      .then((data) => {
        if (data?.playlists) setPlaylists(data.playlists);
        else setPlaylists([]);
      })
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = async (playlistId: string) => {
    if (addedMap[playlistId]) return;

    try {
      // Sync track first if it's from YouTube
      if (track.source === 'youtube') {
        await fetch('/api/tracks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtubeId: track.youtubeId,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            thumbnail: track.thumbnail,
          }),
        });
      }

      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnail: track.thumbnail,
        }),
      });

      if (res.ok) {
        setAddedMap((prev) => ({ ...prev, [playlistId]: true }));
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Create playlist
      const createRes = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim(), isPublic: true }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        const newPlaylistId = createData.playlist.id;

        // 2. Add track to new playlist
        await handleAddToPlaylist(newPlaylistId);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
      setIsCreating(false);
      setNewPlaylistName('');
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-obsidian-accent" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Add to Playlist
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full glass-pill text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl glass-card border border-white/[0.06]">
          <div className="relative w-10 h-10 rounded-xl bg-white/[0.04] overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
            <Image
              src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt={track.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">
              {track.title}
            </div>
            <div className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</div>
          </div>
        </div>

        {/* Subtitle / Helper */}
        <div className="text-[11px] text-white/50 font-medium">
          Select playlist:
        </div>

        {/* Quick Create New Playlist */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-1">
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist title..."
              className="w-full glass-pill rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-white/30"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 text-xs text-white/50 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newPlaylistName.trim()}
                className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-xl flex items-center gap-1 hover:bg-white/90 shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <Plus className="w-3 h-3 text-black" />}
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 rounded-2xl glass-pill hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-obsidian-accent" />
            <span>Create New Playlist</span>
          </button>
        )}

        {/* Playlist List */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-6 text-center text-xs text-white/50 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-obsidian-accent" />
              <span>Loading playlists...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/50">
              No playlists found. Create one above!
            </div>
          ) : (
            playlists.map((playlist) => {
              const isAdded = addedMap[playlist.id];

              return (
                <div
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isAdded
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'glass-card hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="relative w-8 h-8 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0">
                      {playlist.coverImage ? (
                        <Image
                          src={playlist.coverImage}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
                          <Music className="w-3.5 h-3.5 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">
                        {playlist.name}
                      </div>
                      <div className="text-[10px] text-white/50">
                        {playlist.trackCount || playlist.tracks?.length || 0} tracks
                      </div>
                    </div>
                  </div>

                  {isAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(playlist.id);
                      }}
                      className="px-3 py-1 rounded-full glass-pill hover:bg-white text-[11px] font-semibold text-white hover:text-black transition-all"
                    >
                      + Select
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

