'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  MoreVertical,
  PlaySquare,
  ListPlus,
  Heart,
  FolderPlus,
  Check,
  X,
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
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
          className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 flex items-center justify-center shadow-md active:scale-95"
          title="More options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {isOpen && (
          <>
            {/* Mobile Bottom Action Sheet: Guaranteed to never be clipped by cards or UI */}
            <div
              className="sm:hidden fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              className="sm:hidden fixed inset-x-0 bottom-0 z-[100] bg-[#141418]/95 border-t border-white/10 rounded-t-3xl p-5 pb-8 space-y-3 shadow-2xl backdrop-blur-3xl animate-slideUp text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 shadow-md">
                    <Image
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="truncate flex-1">
                    <h4 className="text-white font-semibold text-sm truncate">{track.title}</h4>
                    <p className="text-white/50 text-xs truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full glass-pill text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {actionNotice ? (
                <div className="p-3 text-center text-emerald-400 font-medium flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{actionNotice}</span>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={handlePlayNext}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-white/80 hover:text-white active:bg-white/10 transition-colors text-left"
                  >
                    <PlaySquare className="w-4 h-4 text-obsidian-accent" />
                    <span>Play Next</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToQueue}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-white/80 hover:text-white active:bg-white/10 transition-colors text-left"
                  >
                    <ListPlus className="w-4 h-4 text-indigo-400" />
                    <span>Add to Queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-white/80 hover:text-white active:bg-white/10 transition-colors text-left"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-obsidian-accent text-obsidian-accent' : 'text-rose-400'}`} />
                    <span>{isLiked ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    type="button"
                    onClick={handleOpenPlaylistModal}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-white/80 hover:text-white active:bg-white/10 transition-colors text-left"
                  >
                    <FolderPlus className="w-4 h-4 text-blue-400" />
                    <span>Add to Playlist...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Popover Menu */}
            <div className="hidden sm:block absolute right-0 top-full mt-1.5 w-48 glass-panel border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn text-xs backdrop-blur-2xl">
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <PlaySquare className="w-3.5 h-3.5 text-obsidian-accent" />
                    <span>Play Next</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToQueue}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Add to Queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-obsidian-accent text-obsidian-accent' : ''}`} />
                    <span>{isLiked ? 'Liked Song' : 'Add to Favorites'}</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    type="button"
                    onClick={handleOpenPlaylistModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Add to Playlist...</span>
                  </button>
                </div>
              )}
            </div>
          </>
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
