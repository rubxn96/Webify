'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Sparkles } from 'lucide-react';
import { ArtistDiscovery, Track } from '@/types';
import { useAudio } from '@/components/audio/AudioProvider';

interface ArtistCardProps {
  artistData: ArtistDiscovery;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artistData }) => {
  const { playTrack } = useAudio();

  const handlePlayArtist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artistData.tracks.length > 0) {
      playTrack(artistData.tracks[0], artistData.tracks, true);
    }
  };

  return (
    <div
      onClick={handlePlayArtist}
      className="glass-card group p-4 rounded-3xl cursor-pointer transition-all duration-300 border border-white/10 hover:border-brand-primary/40 hover:bg-white/[0.08] flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Artist Avatar */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3 border-2 border-white/10 shadow-xl shadow-black/40 group-hover:scale-105 transition-transform duration-300">
        <Image
          src={
            artistData.image ||
            artistData.tracks[0]?.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'
          }
          alt={artistData.artist}
          fill
          className="object-cover"
        />

        {/* Hover Play Glass Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-10 h-10 rounded-full bg-brand-primary text-[#0A0A0A] flex items-center justify-center shadow-[0_4px_16px_rgba(16,229,117,0.4)] transform active:scale-90">
            <Play className="w-4 h-4 fill-[#0A0A0A] ml-0.5" />
          </div>
        </div>
      </div>

      {/* Artist Info */}
      <div className="w-full space-y-1 relative z-10">
        <h4 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors truncate">
          {artistData.artist}
        </h4>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {artistData.language && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
              {artistData.language}
            </span>
          )}
          {artistData.genres.slice(0, 1).map((g) => (
            <span
              key={g}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/25"
            >
              {g}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-content-muted pt-1">
          {artistData.tracks.length} recommended tracks
        </p>
      </div>
    </div>
  );
};

