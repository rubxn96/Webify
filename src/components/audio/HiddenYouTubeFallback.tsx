'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface HiddenYouTubeFallbackProps {
  videoId: string | null;
  isPlaying: boolean;
  volume: number;
  seekTime: number | null;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onError: () => void;
}

export const HiddenYouTubeFallback: React.FC<HiddenYouTubeFallbackProps> = ({
  videoId,
  isPlaying,
  volume,
  seekTime,
  onTimeUpdate,
  onEnded,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isReadyRef = useRef<boolean>(false);

  // Load YouTube Iframe API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize or seamlessly load video when videoId changes
  useEffect(() => {
    if (!videoId) return;

    let isCancelled = false;

    // Fast-path: If player already exists and ready, seamlessly load the new video immediately!
    // This avoids destroying/recreating the iframe, prevents white flashes, and avoids autoplay blocks!
    if (playerRef.current && isReadyRef.current) {
      try {
        if (typeof (playerRef.current as any).loadVideoById === 'function') {
          (playerRef.current as any).loadVideoById(videoId, 0);
          playerRef.current.setVolume(Math.round(volume * 100));
          if (isPlaying) {
            playerRef.current.playVideo();
          }
          return;
        }
      } catch {
        // Fall back to full initialization
      }
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !containerRef.current || isCancelled) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      isReadyRef.current = false;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (isCancelled) return;
            isReadyRef.current = true;
            event.target.setVolume(Math.round(volume * 100));
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          },
          onError: () => {
            onError();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      isCancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Handle play / pause state
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Handle volume change
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      playerRef.current.setVolume(Math.round(volume * 100));
    } catch {
      // ignore
    }
  }, [volume]);

  // Handle seek
  useEffect(() => {
    if (seekTime === null || !playerRef.current || !isReadyRef.current) return;
    try {
      playerRef.current.seekTo(seekTime, true);
    } catch {
      // ignore
    }
  }, [seekTime]);

  // Track playback time
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current && isReadyRef.current) {
          try {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            if (dur > 0) {
              onTimeUpdate(cur, dur);
            }
          } catch {
            // ignore
          }
        }
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, onTimeUpdate]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <div ref={containerRef} id="yt-fallback-iframe" />
    </div>
  );
};

