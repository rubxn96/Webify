'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Play, Pause, Music, Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { Skeleton } from '@/components/ui/Skeleton';

export default function FavoritesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, likedTrackIds } = useAudio();

  const fetchFavorites = () => {
    setLoading(true);
    fetch('/api/tracks/like')
      .then((res) => (res.ok ? res.json() : { tracks: [] }))
      .then((data) => {
        if (data.tracks) {
          setTracks(data.tracks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFavorites();
  }, [likedTrackIds.size]);

  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const isPlayingAnyFavorite = tracks.some(
    (t) => t.id === currentTrack?.id || t.youtubeId === currentTrack?.youtubeId
  );

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlayingAnyFavorite) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Hero Header */}
      <div className="glass-panel relative rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-8 shadow-2xl border border-white/10">
        {/* Heart Artwork Box */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-rose-900/40 flex-shrink-0">
          <Heart className="w-20 h-20 fill-white drop-shadow-md animate-pulseSubtle" />
        </div>

        {/* Header Details */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-semibold uppercase tracking-wider text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-obsidian-accent" />
            <span>Pinned Collection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Liked Songs
          </h1>

          <p className="text-xs sm:text-sm text-white/60 max-w-xl">
            Your personal vault of favorite tracks, synchronized across live YouTube searches and catalog releases.
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 text-xs font-mono text-white/50 pt-1">
            <span className="text-white font-bold">{tracks.length} tracks</span>
            <span>&bull;</span>
            <span className="tabular-nums">{formatTime(totalSeconds)} total runtime</span>
          </div>

          {/* Action Row */}
          <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="px-7 py-3 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-2 shadow-xl hover:bg-white/90 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isPlayingAnyFavorite && isPlaying ? (
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
          </div>
        </div>
      </div>

      {/* Track Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3.5 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-white/40">
          <div className="col-span-1">#</div>
          <div className="col-span-7 sm:col-span-6">Title & Artist</div>
          <div className="col-span-3 hidden sm:block">Album / Source</div>
          <div className="col-span-4 sm:col-span-2 text-right">Duration & Actions</div>
        </div>

        {/* Tracks List */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-16 text-center text-white/50 space-y-3">
            <Heart className="w-12 h-12 mx-auto text-white/20" />
            <h3 className="text-base font-semibold text-white">
              No favorites saved yet
            </h3>
            <p className="text-xs max-w-sm mx-auto text-white/50">
              Tap the heart icon on any song on the homepage or search results to save it into your Liked Songs folder.
            </p>
            <div className="pt-2">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                <span>Search Songs</span>
              </Link>
            </div>
          </div>
        ) : (
          tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || currentTrack?.youtubeId === track.youtubeId;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`grid grid-cols-12 px-6 py-3.5 items-center border-b border-white/[0.04] hover:bg-white/[0.06] transition-colors group ${
                  isCurrent ? 'bg-white/[0.08] text-obsidian-accent' : 'text-white/60'
                }`}
              >
                {/* Number / Play Button */}
                <div className="col-span-1 text-xs font-mono">
                  <div
                    onClick={() => (isCurrent ? togglePlay() : playTrack(track, tracks, true))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer group-hover:bg-white group-hover:text-black transition-colors"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current text-obsidian-accent group-hover:text-black" />
                    ) : (
                      <>
                        <span className="group-hover:hidden text-white/40 tabular-nums">
                          {idx + 1}
                        </span>
                        <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5" />
                      </>
                    )}
                  </div>
                </div>

                {/* Title & Artist */}
                <div
                  onClick={() => (isCurrent ? togglePlay() : playTrack(track, tracks, true))}
                  className="col-span-7 sm:col-span-6 flex items-center gap-3.5 cursor-pointer truncate mr-2"
                >
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
                    <div className="text-[11px] text-white/50 truncate mt-0.5">
                      {track.artist}
                    </div>
                  </div>
                </div>

                {/* Album / Source */}
                <div className="col-span-3 hidden sm:block text-xs text-white/50 truncate">
                  {track.album || 'Single / YouTube Release'}
                </div>

                {/* Duration & 3-Dot Actions */}
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track);
                    }}
                    title="Remove from Liked"
                    className="p-1 text-obsidian-accent hover:scale-110 transition-transform"
                  >
                    <Heart className="w-3.5 h-3.5 fill-obsidian-accent" />
                  </button>

                  <span
                    className="text-[11px] text-white/40 mr-1 tabular-nums"
                  >
                    {formatTime(track.duration)}
                  </span>

                  {/* 3-Dot Contextual Menu (Add to Queue, Add to Playlist, Play Next) */}
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

