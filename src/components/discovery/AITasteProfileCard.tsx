'use client';

import React from 'react';
import { Sparkles, Brain, Activity, Zap } from 'lucide-react';
import { AITasteProfile } from '@/types';

interface AITasteProfileCardProps {
  profile: AITasteProfile;
}

export const AITasteProfileCard: React.FC<AITasteProfileCardProps> = ({ profile }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-card via-surface-cardElevated to-surface-pod border border-brand-primary/30 p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Summary & Brain Icon */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Neural Taste Profile</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {profile.summary}
          </h3>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-content-secondary font-mono">
            <span>Primary Focus:</span>
            {profile.dominantGenres.map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-0.5 rounded-full bg-surface-pod border border-white/10 text-white text-[11px] font-semibold"
              >
                {genre}
              </span>
            ))}
            <span className="text-content-muted ml-1">
              &bull; {profile.totalListens} completed telemetry sessions
            </span>
          </div>
        </div>

        {/* Right: Real-time 3-Meter Acoustic Breakdown */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 flex-shrink-0 bg-surface-base/80 border border-white/10 p-3.5 rounded-xl">
          {/* Energy */}
          <div className="space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-content-muted">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Energy</span>
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {Math.round(profile.energyLevel * 100)}%
            </div>
            <div className="w-16 h-1 bg-surface-pod rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.round(profile.energyLevel * 100)}%` }}
              />
            </div>
          </div>

          {/* Danceability */}
          <div className="space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-content-muted">
              <Activity className="w-3 h-3 text-brand-primary" />
              <span>Groove</span>
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {Math.round(profile.danceability * 100)}%
            </div>
            <div className="w-16 h-1 bg-surface-pod rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-brand-primary rounded-full shadow-[0_0_8px_rgba(16,229,117,0.5)]"
                style={{ width: `${Math.round(profile.danceability * 100)}%` }}
              />
            </div>
          </div>

          {/* Acousticness */}
          <div className="space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-content-muted">
              <Brain className="w-3 h-3 text-blue-400" />
              <span>Acoustic</span>
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {Math.round(profile.acousticness * 100)}%
            </div>
            <div className="w-16 h-1 bg-surface-pod rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${Math.round(profile.acousticness * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

