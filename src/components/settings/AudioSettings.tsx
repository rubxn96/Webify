'use client';

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/components/audio/AudioProvider';
import { Radio, Gauge, Disc, Database, Trash2, CheckCircle2 } from 'lucide-react';

export const AudioSettings: React.FC = () => {
  const { userSettings, updateSettings } = useAudio();
  const [cacheSizeKB, setCacheSizeKB] = useState<number>(0);
  const [isCleared, setIsCleared] = useState<boolean>(false);

  // Calculate local storage size
  useEffect(() => {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    setCacheSizeKB(Math.round(totalBytes / 1024));
  }, []);

  const handleClearCache = () => {
    localStorage.removeItem('obsidian_settings');
    setCacheSizeKB(0);
    setIsCleared(true);
    setTimeout(() => setIsCleared(false), 2000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Audio Engine Configuration Card */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 pb-5 border-b border-white/[0.06]">
          <div className="p-2 rounded-xl glass-pill text-obsidian-accent">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">
              Audio Engine & Stream Pipeline
            </h3>
            <p className="text-xs text-white/50">
              Configure bitrate formats, Web Audio normalization, and transition crossfades.
            </p>
          </div>
        </div>

        {/* 1. Bitrate Tier Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase text-white/50 tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-obsidian-accent" />
              Stream Bitrate Tier
            </label>
            <span className="text-xs font-mono text-obsidian-accent uppercase font-semibold">
              {userSettings.bitrate === 'high'
                ? '160kbps Opus'
                : userSettings.bitrate === 'normal'
                ? '128kbps AAC'
                : 'Adaptive'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'auto', label: 'Auto (Adaptive)', desc: 'Optimized for variable bandwidth' },
              { id: 'normal', label: 'Normal (128kbps)', desc: 'Standard AAC audio stream' },
              { id: 'high', label: 'High (160kbps)', desc: 'High-fidelity Opus stream' },
            ].map((tier) => {
              const isSelected = userSettings.bitrate === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => updateSettings({ bitrate: tier.id as 'auto' | 'normal' | 'high' })}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'glass-card border-white/20 bg-white/10 shadow-lg'
                      : 'glass-card hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{tier.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-obsidian-accent bg-obsidian-accent' : 'border-white/20'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">{tier.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Audio Normalization Toggle */}
        <div className="pt-2 flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-obsidian-accent" />
              <span className="text-xs font-mono uppercase text-white/50 tracking-wider">
                Audio Normalization (-14 LUFS Baseline)
              </span>
            </div>
            <p className="text-xs text-white/50">
              Engages a client-side DynamicsCompressorNode to smooth dynamic loudness jumps between tracks.
            </p>
          </div>

          <button
            onClick={() => updateSettings({ normalization: !userSettings.normalization })}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center flex-shrink-0 ${
              userSettings.normalization ? 'bg-obsidian-accent justify-end' : 'bg-white/10 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* 3. Crossfade Slider (0s to 12s) */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">
              Track Crossfade
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }} className="text-xs font-mono text-obsidian-accent font-semibold">
              {userSettings.crossfade}s
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={userSettings.crossfade}
            onChange={(e) => updateSettings({ crossfade: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 accent-obsidian-accent bg-white/15 rounded-full cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-white/40">
            <span>0s (Gapless)</span>
            <span>6s</span>
            <span>12s</span>
          </div>
        </div>
      </div>

      {/* Storage & Resolution Cache Monitor */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl glass-pill text-obsidian-accent">
            <Database className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-white">
              Local Stream Cache & Storage
            </h4>
            <p className="text-xs text-white/50 mt-0.5">
              Cached track manifests, offline metadata & client EQ parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span style={{ fontVariantNumeric: 'tabular-nums' }} className="text-xs font-mono text-white/60 glass-pill px-3 py-1.5 rounded-full">
            {cacheSizeKB} KB used
          </span>

          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-red-500/10 text-xs font-semibold text-white/80 hover:text-red-400 transition-all"
          >
            {isCleared ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Cleared</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-white/50" />
                <span>Clear Cache</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

