'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { ImportException, ImportJobStatus } from '@/types';

export const PlaylistImporter: React.FC = () => {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExceptionsOpen, setIsExceptionsOpen] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setLoading(true);
    setJobStatus(null);
    setJobId(null);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize playlist import');
      }

      setJobId(data.jobId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setLoading(false);
    }
  };

  // Poll background job status
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/import/${jobId}`);
        if (res.ok) {
          const data: ImportJobStatus = await res.json();
          setJobStatus(data);

          if (data.status === 'completed' || data.status === 'failed') {
            setLoading(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch {
        // continue
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 800);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId]);

  const progressPercent =
    jobStatus && jobStatus.totalTracks > 0
      ? Math.round((jobStatus.matchedTracks / jobStatus.totalTracks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Importer Form Card */}
      <div className="bg-obsidian-card border border-obsidian-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-obsidian-border">
          <div className="p-2.5 rounded-xl bg-obsidian-sidebar border border-obsidian-border text-obsidian-accent">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tightest text-obsidian-primary">
              Import Playlist from Spotify or Apple Music
            </h2>
            <p className="text-xs text-obsidian-secondary mt-0.5">
              Enter a playlist URL. Our worker fuzzy-matches tracks via ISRC and YouTube audio search.
            </p>
          </div>
        </div>

        {/* Input & Action */}
        <form onSubmit={handleStartImport} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-obsidian-secondary tracking-wider">
              Playlist URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or https://music.apple.com/..."
                className="flex-1 bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-lg px-4 py-2.5 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-2.5 rounded-lg bg-obsidian-accent hover:bg-obsidian-accent-hover disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md flex-shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resolving Catalog...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Import Playlist</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Demo URL suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-obsidian-secondary">
            <span>Quick test URLs:</span>
            <button
              type="button"
              onClick={() => setUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')}
              className="px-2.5 py-1 rounded bg-obsidian-sidebar border border-obsidian-border hover:border-obsidian-accent text-obsidian-primary text-[11px] font-mono transition-colors"
            >
              Today&apos;s Top Hits (Spotify)
            </button>
            <button
              type="button"
              onClick={() => setUrl('https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb')}
              className="px-2.5 py-1 rounded bg-obsidian-sidebar border border-obsidian-border hover:border-obsidian-accent text-obsidian-primary text-[11px] font-mono transition-colors"
            >
              Today&apos;s Hits (Apple Music)
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Matching Progress */}
        {jobStatus && (
          <div className="space-y-4 pt-4 border-t border-obsidian-border animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {jobStatus.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : jobStatus.status === 'failed' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <Loader2 className="w-4 h-4 text-obsidian-accent animate-spin" />
                )}
                <span className="font-semibold text-obsidian-primary">
                  {jobStatus.playlistTitle || 'Import Job'}
                </span>
              </div>

              <div className="font-mono text-obsidian-secondary">
                <span className="text-obsidian-primary font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {jobStatus.matchedTracks}
                </span>{' '}
                / <span style={{ fontVariantNumeric: 'tabular-nums' }}>{jobStatus.totalTracks}</span> matched (
                {progressPercent}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-obsidian-sidebar rounded-full overflow-hidden border border-obsidian-border">
              <div
                className={`h-full transition-all duration-300 ${
                  jobStatus.status === 'completed'
                    ? 'bg-emerald-500'
                    : jobStatus.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-obsidian-accent'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {jobStatus.status === 'completed' && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="text-xs text-emerald-400 font-medium">
                  Playlist imported successfully! Added to your library.
                </div>
                <button
                  onClick={() => router.push('/playlists')}
                  className="px-3 py-1.5 rounded bg-emerald-500 text-obsidian-canvas font-medium text-xs flex items-center gap-1 hover:bg-emerald-400 transition-colors"
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>View in Library</span>
                </button>
              </div>
            )}

            {/* Exceptions Drawer Trigger */}
            {jobStatus.unresolvedTracks && jobStatus.unresolvedTracks.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsExceptionsOpen(!isExceptionsOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-obsidian-sidebar border border-obsidian-border hover:border-obsidian-secondary text-xs text-obsidian-secondary hover:text-obsidian-primary transition-all"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>
                      {jobStatus.unresolvedTracks.length} Unresolved Track
                      {jobStatus.unresolvedTracks.length > 1 ? 's' : ''} (Exceptions Drawer)
                    </span>
                  </div>
                  {isExceptionsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Exceptions Drawer Content */}
                {isExceptionsOpen && (
                  <div className="mt-2 bg-obsidian-sidebar/80 border border-obsidian-border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                    {jobStatus.unresolvedTracks.map((exc: ImportException, i: number) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded bg-obsidian-card border border-obsidian-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <div>
                          <span className="font-medium text-obsidian-primary">{exc.title}</span>
                          <span className="text-obsidian-secondary"> — {exc.artist}</span>
                          {exc.isrc && (
                            <span className="text-[10px] font-mono text-obsidian-secondary/70 ml-2">
                              [{exc.isrc}]
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-amber-400/90">{exc.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

