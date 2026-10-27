'use client';

import React from 'react';
import { EqualizerGraph } from '@/components/settings/EqualizerGraph';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { Sliders } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="flex items-center gap-3 pb-6 border-b border-obsidian-border">
        <div className="p-2.5 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-accent">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tightest text-obsidian-primary">
            Audio Studio & Settings
          </h1>
          <p className="text-xs text-obsidian-secondary mt-1">
            Precision DSP filtering, dynamics normalization, and streaming telemetry controls.
          </p>
        </div>
      </div>

      {/* Equalizer Component */}
      <EqualizerGraph />

      {/* Audio Engine & Cache Component */}
      <AudioSettings />
    </div>
  );
}
