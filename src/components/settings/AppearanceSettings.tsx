'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Palette, Sparkles, Check } from 'lucide-react';

export type ThemeChoice = 'dark' | 'light' | 'system';

export const AppearanceSettings: React.FC = () => {
  const [theme, setTheme] = useState<ThemeChoice>('dark');
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);

  useEffect(() => {
    // Read saved theme
    const savedTheme = (localStorage.getItem('webify_theme') as ThemeChoice) || 'dark';
    setTheme(savedTheme);

    const savedGlow = localStorage.getItem('webify_ambient_glow');
    if (savedGlow !== null) {
      setAmbientGlow(savedGlow === 'true');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem('webify_theme');
      if (current === 'system') {
        const eff = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', eff);
        if (eff === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const handleThemeChange = (newTheme: ThemeChoice) => {
    setTheme(newTheme);
    localStorage.setItem('webify_theme', newTheme);

    let effectiveTheme = newTheme;
    if (newTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const handleToggleGlow = () => {
    const next = !ambientGlow;
    setAmbientGlow(next);
    localStorage.setItem('webify_ambient_glow', String(next));

    // Update backdrop element opacity
    const backdrop = document.getElementById('webify-dynamic-backdrop');
    if (backdrop) {
      backdrop.style.display = next ? 'block' : 'none';
    }
  };

  return (
    <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-white/[0.06]">
        <div className="p-2 rounded-xl glass-pill text-obsidian-accent">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Appearance &amp; Theme
          </h3>
          <p className="text-xs text-white/50">
            Customize interface styling, dark/light themes, and ambient lighting.
          </p>
        </div>
      </div>

      {/* Theme Cards */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase text-white/50 tracking-wider">
          Interface Theme
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'dark' as ThemeChoice,
              label: 'Dark Mode',
              desc: 'Deep obsidian & frosted glass',
              icon: Moon,
              iconColor: 'text-purple-400',
              bgPreview: 'bg-zinc-950 border-white/20',
            },
            {
              id: 'light' as ThemeChoice,
              label: 'Light Mode',
              desc: 'Crisp clean daylight studio',
              icon: Sun,
              iconColor: 'text-amber-400',
              bgPreview: 'bg-white border-zinc-300 text-zinc-900',
            },
            {
              id: 'system' as ThemeChoice,
              label: 'System Auto',
              desc: 'Follows your operating system',
              icon: Laptop,
              iconColor: 'text-cyan-400',
              bgPreview: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-white',
            },
          ].map((item) => {
            const isSelected = theme === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleThemeChange(item.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-obsidian-accent bg-white/10 shadow-xl ring-1 ring-obsidian-accent/40'
                    : 'glass-card border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl glass-pill ${item.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-obsidian-accent text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-white/50">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambient Artwork Glow Toggle */}
      <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
        <div className="space-y-1 pr-4">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-obsidian-accent" />
            <span>Fluid Ambient Album Glow</span>
          </div>
          <p className="text-[11px] text-white/50">
            Dynamically illuminates background canvas with smooth blurred colors extracted from the current track.
          </p>
        </div>

        <button
          onClick={handleToggleGlow}
          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center flex-shrink-0 ${
            ambientGlow ? 'bg-obsidian-accent justify-end' : 'bg-white/10 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
        </button>
      </div>
    </div>
  );
};
