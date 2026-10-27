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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="glass-panel flex flex-col sm:flex-row items-center sm:items-end gap-8 p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-white/[0.04] flex-shrink-0 shadow-2xl shadow-black/80 border border-white/10">
          <Image
            src={playlist.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-3 truncate w-full">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
            <span>Playlist</span>
            <span>&bull;</span>
            <button
              onClick={toggleVisibility}
              disabled={isUpdatingVisibility}
              className="inline-flex items-center gap-1 text-white hover:text-obsidian-accent transition-colors"
            >
              {playlist.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white truncate">
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-white/60 line-clamp-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-mono text-white/50 pt-1">
            <span className="text-white font-bold">{tracks.length} tracks</span>
            <span>&bull;</span>
            <span className="tabular-nums">{formatTime(totalSeconds)} total runtime</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="px-7 py-3 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-2 shadow-xl hover:bg-white/90 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isPlaylistActive && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-black" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                  <span>Play All</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeletePlaylist}
              className="p-3 rounded-full glass-pill text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3.5 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-white/40">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Title & Artist</div>
          <div className="col-span-3 hidden sm:block">Album</div>
          <div className="col-span-2 text-right">Duration & Actions</div>
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <div className="p-16 text-center text-white/40 text-xs">
            No tracks in this playlist yet. Add tracks from the homepage or search.
          </div>
        ) : (
          tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;
            const isLiked = likedTrackIds.has(track.id);

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`grid grid-cols-12 px-6 py-3.5 items-center border-b border-white/[0.04] hover:bg-white/[0.06] transition-colors group ${
                  isCurrent ? 'bg-white/[0.08] text-obsidian-accent' : 'text-white/60'
                }`}
              >
                {/* Index / Play Hover */}
                <div className="col-span-1 text-xs font-mono">
                  <span className="group-hover:hidden text-white/40 tabular-nums">{idx + 1}</span>
                  <button
                    onClick={() => playTrack(track, tracks)}
                    className="hidden group-hover:block text-white hover:text-obsidian-accent"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Title & Artist & Thumbnail */}
                <div className="col-span-6 flex items-center gap-3.5 truncate pr-4">
                  <div className="relative w-10 h-10 rounded-xl bg-white/[0.04] overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
                    <Image
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? 'text-obsidian-accent font-bold' : 'text-white/95'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</div>
                  </div>
                </div>

                {/* Album */}
                <div className="col-span-3 hidden sm:block text-xs text-white/50 truncate">
                  {track.album || track.isrc || '—'}
                </div>

                {/* Duration & Reordering / Remove Controls */}
                <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => toggleLike(track)}
                    className="p-1 hover:text-white transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent text-obsidian-accent' : 'text-white/40'}`} />
                  </button>

                  <span className="text-[11px] text-white/40 mr-1 tabular-nums">
                    {formatTime(track.duration)}
                  </span>

                  <button
                    onClick={() => handleMoveTrack(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Track Up"
                    className="p-1 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleMoveTrack(idx, 'down')}
                    disabled={idx === tracks.length - 1}
                    title="Move Track Down"
                    className="p-1 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    title="Remove Track"
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

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

