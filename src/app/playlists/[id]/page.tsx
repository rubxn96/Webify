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
  Sparkles,
} from 'lucide-react';
import { Playlist, Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { emitTelemetryBeacon } from '@/lib/telemetry/beacon';

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
        emitTelemetryBeacon({
          trackId,
          event: 'playlist_remove',
          progressSeconds: 0,
          durationSeconds: 0,
        });
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
      playTrack(tracks[0], tracks, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="glass-panel flex flex-col sm:flex-row items-center sm:items-end gap-8 p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden bg-surface-container-low/80">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-surface-container-highest flex-shrink-0 shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-white/10 group">
          <Image
            src={playlist.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
            alt={playlist.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="space-y-3.5 truncate w-full flex flex-col justify-end">
          {/* Tagline & Verified Marker */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary font-mono text-[10px] uppercase tracking-widest font-bold border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary fill-primary/30" />
              Playlist Spotlight
            </span>
            <span className="text-outline text-xs">•</span>
            <button
              onClick={toggleVisibility}
              disabled={isUpdatingVisibility}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-wider transition-colors"
            >
              {playlist.isPublic ? <Globe className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{playlist.isPublic ? 'Public Mix' : 'Private'}</span>
            </button>
            <span className="text-outline text-xs">•</span>
            <span className="text-outline text-xs">Webify Sound Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface truncate">
            {playlist.name}
          </h1>

          {playlist.description ? (
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl line-clamp-2 leading-relaxed">
              Curated high-fidelity audio stream powered by 10-band graphic DSP equalization and adaptive normalization.
            </p>
          )}

          {/* Metadata Strip */}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap pt-1">
            <span className="text-on-surface font-semibold">{tracks.length} songs</span>
            <span className="text-outline">•</span>
            <span className="tabular-nums">{formatTime(totalSeconds)} total runtime</span>
            <span className="text-outline">•</span>
            <div className="flex items-center gap-1 text-primary">
              <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="font-semibold text-on-surface">Lossless FLAC ready</span>
            </div>
          </div>

          {/* Tactile Action Toolbar */}
          <div className="flex items-center gap-4 pt-3 flex-wrap">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_28px_rgba(111,255,154,0.45)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
              title="Play Playlist"
            >
              {isPlaylistActive && isPlaying ? (
                <Pause className="w-6 h-6 fill-on-primary text-on-primary" />
              ) : (
                <Play className="w-6 h-6 fill-on-primary text-on-primary ml-0.5" />
              )}
            </button>

            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold transition-all border border-white/10"
            >
              <span>Shuffle Play</span>
            </button>

            <button
              onClick={handleDeletePlaylist}
              className="w-11 h-11 rounded-full bg-surface-container hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-colors border border-white/10"
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
                  isCurrent ? 'bg-brand-primary/10 text-brand-primary' : 'text-white/60'
                }`}
              >
                {/* Index / Play Hover */}
                <div className="col-span-1 text-xs font-mono">
                  <span className="group-hover:hidden text-content-muted tabular-nums">{idx + 1}</span>
                  <button
                    onClick={() => (isCurrent ? togglePlay() : playTrack(track, tracks, true))}
                    className="hidden group-hover:block text-white hover:text-brand-primary transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Title & Artist & Thumbnail */}
                <div
                  onClick={() => (isCurrent ? togglePlay() : playTrack(track, tracks, true))}
                  className="col-span-6 flex items-center gap-3.5 truncate pr-4 cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-xl bg-surface-pod overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
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
                        isCurrent ? 'text-brand-primary font-bold' : 'text-white/95 group-hover:text-brand-primary transition-colors'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="text-[11px] text-content-secondary truncate mt-0.5">{track.artist}</div>
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
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-brand-primary text-brand-primary' : 'text-content-muted'}`} />
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

