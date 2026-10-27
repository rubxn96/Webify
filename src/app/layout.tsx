import type { Metadata } from 'next';
import './globals.css';
import { AudioProvider } from '@/components/audio/AudioProvider';
import { MainShell } from '@/components/layout/MainShell';

export const metadata: Metadata = {
  title: 'Obsidian — High-Fidelity Ad-Free Music Streaming',
  description: 'Precision Web Audio DSP engine, 10-band equalizer, audio normalization, and YouTube streaming.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-canvas text-obsidian-primary antialiased">
        <AudioProvider>
          <MainShell>{children}</MainShell>
        </AudioProvider>
      </body>
    </html>
  );
}
