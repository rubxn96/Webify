'use client';

import React from 'react';
import { useAudio } from '@/components/audio/AudioProvider';
import { EQ_BAND_LABELS, EQ_PRESETS, EQPresetName } from '@/lib/audio/dspPresets';
import { Sliders, Check } from 'lucide-react';

export const EqualizerGraph: React.FC = () => {
  const { userSettings, updateSettings, setEqBandGain, setEqPreset } = useAudio();

  const presets: EQPresetName[] = ['Flat', 'Bass Boost', 'Vocal', 'Acoustic', 'Electronic', 'Custom'];

  return (
    <div className="bg-obsidian-card border border-obsidian-border rounded-xl p-6 space-y-6">
      {/* Header & Master Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-obsidian-border">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-obsidian-accent" />
          <div>
            <h3 className="text-base font-semibold tracking-tightest text-obsidian-primary">
              10-Band DSP Graphic Equalizer
            </h3>
            <p className="text-xs text-obsidian-secondary">
              Real-time BiquadFilter frequency shaping with ±12dB gain range.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-obsidian-secondary">
            {userSettings.eqEnabled ? 'ACTIVE' : 'BYPASS'}
          </span>
          <button
            onClick={() => updateSettings({ eqEnabled: !userSettings.eqEnabled })}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              userSettings.eqEnabled ? 'bg-obsidian-accent justify-end' : 'bg-obsidian-hover justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-obsidian-primary shadow-sm" />
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-obsidian-secondary uppercase tracking-wider">
          Tuning Presets
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presets.map((preset) => {
            const isSelected = userSettings.eqPreset === preset;
            return (
              <button
                key={preset}
                onClick={() => setEqPreset(preset)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-obsidian-accent text-obsidian-primary border-obsidian-accent shadow-sm'
                    : 'bg-obsidian-sidebar border-obsidian-border text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Band Graphic EQ Sliders */}
      <div className={`space-y-4 transition-opacity ${userSettings.eqEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex justify-between items-center text-xs font-mono text-obsidian-secondary px-1">
          <span>+12 dB</span>
          <span className="text-[10px]">0 dB (BASELINE)</span>
          <span>-12 dB</span>
        </div>

        {/* Vertical Equalizer Sliders Container */}
        <div className="bg-obsidian-sidebar/60 border border-obsidian-border rounded-xl p-4 sm:p-6 grid grid-cols-5 sm:grid-cols-10 gap-3 sm:gap-2">
          {EQ_BAND_LABELS.map((label, index) => {
            const gain = userSettings.eqBands[index] ?? 0;

            return (
              <div key={label} className="flex flex-col items-center gap-2">
                {/* dB Readout */}
                <span
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  className={`text-[10px] font-mono font-medium ${
                    gain > 0
                      ? 'text-obsidian-accent'
                      : gain < 0
                      ? 'text-blue-400'
                      : 'text-obsidian-secondary'
                  }`}
                >
                  {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                </span>

                {/* Vertical Slider Track */}
                <div className="relative h-40 flex items-center justify-center">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={gain}
                    onChange={(e) => setEqBandGain(index, parseFloat(e.target.value))}
                    className="slider-vertical h-36 w-2 accent-obsidian-accent cursor-pointer bg-obsidian-card rounded"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      WebkitAppearance: 'slider-vertical',
                    }}
                  />
                </div>

                {/* Frequency Band Label */}
                <span className="text-[10px] font-mono text-obsidian-secondary mt-1">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
