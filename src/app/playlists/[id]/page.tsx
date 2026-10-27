'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Globe,
  Lock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Heart,
  Music,
  Share2,
} from 'lucide-react';
import { Playlist, Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlay, likedTrackIds, toggleLike } = useAudio();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const fetchPlaylist = () => {
    fetch(`/api/playlists/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.playlist) setPlaylist(data.playlist);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchPlaylist();
  }, [id]);

  const toggleVisibility = async () => {
    if (!playlist) return;
    setIsUpdatingVisibility(true);
    const newVisibility = !playlist.isPublic;

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newVisibility }),
      });

      if (res.ok) {
        setPlaylist((prev) => (prev ? { ...prev, isPublic: newVisibility } : null));
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/library');
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}/tracks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      if (res.ok) {
        fetchPlaylist();
      }
    } catch {
      // ignore
    }
  };

  const handleMoveTrack = async (index: number, direction: 'up' | 'down') => {
    if (!playlist || !playlist.tracks) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.tracks.length) return;

    const newTracks = [...playlist.tracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[targetIndex];
    newTracks[targetIndex] = temp;

    // Optimistically update
    setPlaylist({ ...playlist, tracks: newTracks });

    // Persist reordered positions
    const reorderedTrackIds = newTracks.map((t) => t.id);
    await fetch(`/api/playlists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorderedTrackIds }),
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-16 text-center text-obsidian-secondary space-y-3">
        <Music className="w-12 h-12 mx-auto text-obsidian-border" />
        <h2 className="text-base font-semibold text-obsidian-primary">Playlist Not Found</h2>
        <p className="text-xs">The requested playlist does not exist or is set to private.</p>
      </div>
    );
  }

  const tracks = playlist.tracks || [];
  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const isPlaylistActive = tracks.some((t) => currentTrack?.id === t.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlaylistActive) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 bg-obsidian-card border border-obsidian-border rounded-2xl">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-xl overflow-hidden bg-obsidian-sidebar flex-shrink-0 shadow-2xl border border-obsidian-border">
          <Image
            src={playlist.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-3 truncate w-full">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-obsidian-secondary">
            <span>Playlist</span>
            <span>&bull;</span>
            <button
              onClick={toggleVisibility}
              disabled={isUpdatingVisibility}
              className="inline-flex items-center gap-1 text-obsidian-primary hover:text-obsidian-accent transition-colors"
            >
              {playlist.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tightest text-obsidian-primary truncate">
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-obsidian-secondary line-clamp-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-mono text-obsidian-secondary pt-1">
            <span>{tracks.length} tracks</span>
            <span>&bull;</span>
            <span>{formatTime(totalSeconds)} total runtime</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="px-6 py-2.5 rounded-full bg-obsidian-primary hover:bg-white text-obsidian-canvas font-semibold text-xs flex items-center gap-2 shadow-lg disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
            >
              {isPlaylistActive && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-obsidian-canvas" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-obsidian-canvas ml-0.5" />
                  <span>Play All</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeletePlaylist}
              className="p-2.5 rounded-full border border-obsidian-border bg-obsidian-sidebar hover:bg-red-500/10 hover:border-red-500/40 text-obsidian-secondary hover:text-red-400 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track Table */}
      <div className="bg-obsidian-card border border-obsidian-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 border-b border-obsidian-border text-[11px] font-mono uppercase tracking-wider text-obsidian-secondary">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Title & Artist</div>
          <div className="col-span-3 hidden sm:block">Album / ISRC</div>
          <div className="col-span-2 text-right">Duration & Actions</div>
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <div className="p-12 text-center text-obsidian-secondary text-xs">
            No tracks in this playlist yet. Add tracks from the homepage or search.
          </div>
        ) : (
          tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;
            const isLiked = likedTrackIds.has(track.id);

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`grid grid-cols-12 px-5 py-3 items-center border-b border-obsidian-border/40 hover:bg-obsidian-hover/60 transition-colors group ${
                  isCurrent ? 'bg-obsidian-hover/40 text-obsidian-accent' : 'text-obsidian-secondary'
                }`}
              >
                {/* Index / Play Hover */}
                <div className="col-span-1 text-xs font-mono">
                  <span className="group-hover:hidden">{idx + 1}</span>
                  <button
                    onClick={() => playTrack(track, tracks)}
                    className="hidden group-hover:block text-obsidian-primary hover:text-obsidian-accent"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Title & Artist & Thumbnail */}
                <div className="col-span-6 flex items-center gap-3 truncate pr-4">
                  <div className="relative w-9 h-9 rounded bg-obsidian-sidebar overflow-hidden flex-shrink-0">
                    <Image
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <div
                      className={`text-xs font-medium truncate ${
                        isCurrent ? 'text-obsidian-accent font-semibold' : 'text-obsidian-primary'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="text-[11px] text-obsidian-secondary truncate">{track.artist}</div>
                  </div>
                </div>

                {/* Album */}
                <div className="col-span-3 hidden sm:block text-xs text-obsidian-secondary truncate">
                  {track.album || track.isrc || '—'}
                </div>

                {/* Duration & Reordering / Remove Controls */}
                <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => toggleLike(track)}
                    className="p-1 hover:text-obsidian-primary transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent text-obsidian-accent' : ''}`} />
                  </button>

                  <span className="text-[11px] text-obsidian-secondary mr-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(track.duration)}
                  </span>

                  <button
                    onClick={() => handleMoveTrack(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Track Up"
                    className="p-1 text-obsidian-secondary hover:text-obsidian-primary disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleMoveTrack(idx, 'down')}
                    disabled={idx === tracks.length - 1}
                    title="Move Track Down"
                    className="p-1 text-obsidian-secondary hover:text-obsidian-primary disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    title="Remove Track"
                    className="p-1 text-obsidian-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <TrackContextMenu track={track} />

                  <TrackContextMenu track={track} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

