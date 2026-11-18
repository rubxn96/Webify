import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AudioProvider } from '@/components/audio/AudioProvider';
import { MainShell } from '@/components/layout/MainShell';

export const metadata: Metadata = {
  title: 'Webify — High-Fidelity Ad-Free Music Streaming',
  description: 'Precision Web Audio DSP engine, 10-band equalizer, audio normalization, and YouTube streaming.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Webify',
  },
};

export const viewport: Viewport = {
  themeColor: '#10E575',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Webify" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('webify_theme') || 'dark';
                  var theme = saved;
                  if (saved === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-obsidian-canvas text-obsidian-primary antialiased">
        <AudioProvider>
          <MainShell>{children}</MainShell>
        </AudioProvider>
      </body>
    </html>
  );
}
