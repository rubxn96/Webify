'use client';

import React, { useState } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { EqualizerGraph } from '@/components/settings/EqualizerGraph';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { Settings, Palette, Sliders, Disc } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'appearance' | 'equalizer' | 'audio'>('all');

  const tabs = [
    { id: 'all', label: 'All Settings', icon: Settings },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'equalizer', label: 'DSP Equalizer', icon: Sliders },
    { id: 'audio', label: 'Audio Engine & Cache', icon: Disc },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl glass-card border border-white/10 text-obsidian-accent shadow-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Studio Settings
            </h1>
            <p className="text-xs text-white/50 mt-0.5">
              Customize interface themes, Web Audio 10-band DSP filtering, and playback fidelity.
            </p>
          </div>
        </div>

        {/* Tab Quick Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-white/10 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-obsidian-accent text-white shadow-md font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      {(activeTab === 'all' || activeTab === 'appearance') && (
        <section className="space-y-3">
          <AppearanceSettings />
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'equalizer') && (
        <section className="space-y-3">
          <EqualizerGraph />
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'audio') && (
        <section className="space-y-3">
          <AudioSettings />
        </section>
      )}
    </div>
  );
}
