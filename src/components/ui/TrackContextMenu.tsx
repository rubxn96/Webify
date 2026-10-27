'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  PlaySquare,
  ListPlus,
  Heart,
  FolderPlus,
  Check,
} from 'lucide-react';
import { Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';
import { AddToPlaylistModal } from './AddToPlaylistModal';

interface TrackContextMenuProps {
  track: Track;
  className?: string;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ track, className = '' }) => {
  const { queue, queueIndex, reorderQueue, addToQueue, toggleLike, likedTrackIds } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLiked = likedTrackIds.has(track.id) || likedTrackIds.has(track.youtubeId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
      setIsOpen(false);
    }, 600);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQueue = [...queue];
    const insertIdx = queueIndex >= 0 ? queueIndex + 1 : 0;
    newQueue.splice(insertIdx, 0, track);
    reorderQueue(newQueue);
    showNotice('Playing next');
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    showNotice('Added to queue');
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(track);
    showNotice(isLiked ? 'Removed from Liked' : 'Saved to Liked');
  };

  const handleOpenPlaylistModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsPlaylistModalOpen(true);
  };

  return (
    <>
      <div ref={menuRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-obsidian-secondary hover:text-obsidian-primary transition-colors backdrop-blur-sm shadow-md"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 w-48 bg-obsidian-card border border-obsidian-border rounded-xl shadow-2xl p-1 z-50 animate-fadeIn text-xs">
            {actionNotice ? (
              <div className="p-2.5 text-center text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{actionNotice}</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={handlePlayNext}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors text-left"
                >
                  <PlaySquare className="w-3.5 h-3.5 text-obsidian-accent" />
                  <span>Play Next</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToQueue}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors text-left"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Add to Queue</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors text-left"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent text-obsidian-accent' : ''}`} />
                  <span>{isLiked ? 'Liked Song' : 'Add to Favorites'}</span>
                </button>

                <div className="my-1 border-t border-obsidian-border/50" />

                <button
                  type="button"
                  onClick={handleOpenPlaylistModal}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors text-left"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add to Playlist...</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        track={track}
        onClose={() => setIsPlaylistModalOpen(false)}
      />
    </>
  );
};

