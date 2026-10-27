'use client';

import React from 'react';
import Image from 'next/image';
import { X, ListMusic, Trash2, Play, ArrowUp, ArrowDown } from 'lucide-react';
import { useAudio } from './AudioProvider';
import { formatTime } from '@/lib/audio/timeFormat';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isQueueOpen,
    setIsQueueOpen,
    playTrack,
    removeFromQueue,
    reorderQueue,
  } = useAudio();

  if (!isQueueOpen) return null;

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...queue];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    reorderQueue(copy);
  };

  const moveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const copy = [...queue];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    reorderQueue(copy);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-obsidian-sidebar border-l border-obsidian-border z-50 flex flex-col shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-obsidian-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-obsidian-accent" />
          <h3 className="text-sm font-semibold tracking-tightest text-obsidian-primary">
            Play Queue
          </h3>
          <span className="text-xs text-obsidian-secondary font-mono">
            ({queue.length})
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold hidden sm:inline">
            Dynamic
          </span>
        </div>
        <button
          onClick={() => setIsQueueOpen(false)}
          className="p-1 rounded text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Now Playing Banner */}
      {currentTrack && (
        <div className="p-3 border-b border-obsidian-border bg-obsidian-card/40">
          <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian-accent font-semibold mb-1">
            Now Playing
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded bg-obsidian-card overflow-hidden flex-shrink-0">
              <Image
                src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-medium text-obsidian-primary truncate">
                {currentTrack.title}
              </div>
              <div className="text-[11px] text-obsidian-secondary truncate">
                {currentTrack.artist}
              </div>
            </div>
            <span className="text-[11px] font-mono text-obsidian-secondary">
              {formatTime(currentTrack.duration)}
            </span>
          </div>
        </div>
      )}

      {/* Next Up Tracks List */}
      <div className="flex-1 overflow-y-auto p-2 pb-36 lg:pb-4 space-y-1">
        <div className="px-2 py-1 text-[11px] font-mono uppercase text-obsidian-secondary font-semibold">
          Next In Queue
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-xs text-obsidian-secondary">
            Queue is empty. Click any song to start playback.
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id || idx === queueIndex;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group flex items-center justify-between p-2 rounded transition-colors ${
                  isCurrent
                    ? 'bg-obsidian-card border border-obsidian-border text-obsidian-primary'
                    : 'hover:bg-obsidian-hover/50 text-obsidian-secondary'
                }`}
              >
                <div
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 truncate cursor-pointer flex-1 mr-2"
                >
                  <div className="relative w-9 h-9 rounded bg-obsidian-card overflow-hidden flex-shrink-0">
                    <Image
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-3.5 h-3.5 text-obsidian-primary fill-obsidian-primary" />
                    </div>
                  </div>

                  <div className="truncate flex-1">
                    <div
                      className={`text-xs truncate ${
                        isCurrent
                          ? 'font-medium text-obsidian-accent'
                          : 'group-hover:text-obsidian-primary'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="text-[11px] text-obsidian-secondary truncate">
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-obsidian-secondary mr-2">
                    {formatTime(track.duration)}
                  </span>

                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 text-obsidian-secondary hover:text-obsidian-primary disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === queue.length - 1}
                    className="p-1 text-obsidian-secondary hover:text-obsidian-primary disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 text-obsidian-secondary hover:text-red-400 transition-colors ml-1"
                    title="Remove and auto-fill with another similar song"
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
};

