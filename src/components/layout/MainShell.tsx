'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DynamicBackdrop } from './DynamicBackdrop';
import { MiniPlayer } from '@/components/audio/MiniPlayer';
import { LyricsViewer } from '@/components/audio/LyricsViewer';
import { QueueDrawer } from '@/components/audio/QueueDrawer';
import { FullscreenPlayerModal } from '@/components/audio/FullscreenPlayerModal';

export const MainShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian-canvas text-obsidian-primary font-sans antialiased">
      {/* Dynamic Backdrop Tint Sampling Current Album Art */}
      <DynamicBackdrop />

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-28 scroll-smooth scrollbar-thin scrollbar-thumb-obsidian-border">
          {children}
        </main>
      </div>

      {/* Persistent Audio Controls & Modals */}
      <MiniPlayer />
      <LyricsViewer />
      <QueueDrawer />
      <FullscreenPlayerModal />
    </div>
  );
};

