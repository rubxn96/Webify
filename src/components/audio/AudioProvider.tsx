'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, UserSettings } from '@/types';
import { AudioGraph } from '@/lib/audio/AudioGraph';
import { DEFAULT_USER_SETTINGS, EQ_PRESETS, EQPresetName } from '@/lib/audio/dspPresets';
import { HiddenYouTubeFallback } from './HiddenYouTubeFallback';
import { emitTelemetryBeacon } from '@/lib/telemetry/beacon';

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackMode: 'direct' | 'iframe';
  userSettings: UserSettings;
  queue: Track[];
  queueIndex: number;
  likedTrackIds: Set<string>;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFullPlayerOpen: boolean;
  visualizerData: Uint8Array;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLike: (track: Track) => void;
  addToQueue: (track: Track) => void;
  reorderQueue: (newQueue: Track[]) => void;
  removeFromQueue: (index: number) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  setEqBandGain: (index: number, db: number) => void;
  setEqPreset: (presetName: EQPresetName) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  setIsFullPlayerOpen: (open: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

function cleanNorm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<'direct' | 'iframe'>('direct');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // UI mod panels
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);

  // Fallback iframe seek command
  const [iframeSeekTime, setIframeSeekTime] = useState<number | null>(null);

  // Settings
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // Visualizer array (32 frequency bins)
  const [visualizerData] = useState<Uint8Array>(new Uint8Array(32));

  // Audio elements & graph
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioGraphRef = useRef<AudioGraph | null>(null);

  // Prebuffering flag for gapless playback (at 85%)
  const prebufferedIndexRef = useRef<number | null>(null);

  // Telemetry refs
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressTrackRef = useRef<string | null>(null);
  const trackStartTimeRef = useRef<number>(0);

  // Debounced settings sync timer
  const settingsSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize AudioGraph & LocalStorage settings
  useEffect(() => {
    const saved = localStorage.getItem('obsidian_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }

    fetch('/api/tracks/like')
      .then((res) => (res.ok ? res.json() : { likedTrackIds: [] }))
      .then((data) => {
        if (data.likedTrackIds) {
          setLikedTrackIds(new Set(data.likedTrackIds));
        }
      })
      .catch(() => {});

    const graph = new AudioGraph();
    audioGraphRef.current = graph;

    if (audioElementRef.current) {
      try {
        graph.init(audioElementRef.current);
      } catch {
        // user interaction might be needed
      }
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (settingsSyncTimerRef.current) clearTimeout(settingsSyncTimerRef.current);
    };
  }, []);

  // Sync settings with AudioGraph in real-time
  useEffect(() => {
    if (!audioGraphRef.current) return;
    audioGraphRef.current.setEqEnabled(userSettings.eqEnabled);
    audioGraphRef.current.setBands(userSettings.eqBands);
    audioGraphRef.current.setNormalization(userSettings.normalization);
  }, [userSettings]);

  // Visualizer animation loop
  useEffect(() => {
    let animId: number;
    const updateVisualizer = () => {
      if (audioGraphRef.current && isPlaying && playbackMode === 'direct') {
        audioGraphRef.current.getVisualizerData(visualizerData);
      } else if (isPlaying && playbackMode === 'iframe') {
        for (let i = 0; i < visualizerData.length; i++) {
          visualizerData[i] = Math.floor(Math.random() * 80 + 40);
        }
      }
      animId = requestAnimationFrame(updateVisualizer);
    };
    animId = requestAnimationFrame(updateVisualizer);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackMode, visualizerData]);

  // Telemetry Progress Beacon (Every 10 seconds)
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    if (isPlaying && currentTrack) {
      progressTimerRef.current = setInterval(() => {
        emitTelemetryBeacon({
          trackId: currentTrack.id,
          event: 'track_progress',
          progressSeconds: currentTime,
          durationSeconds: duration || currentTrack.duration,
        });
      }, 10000);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, currentTrack, currentTime, duration]);

  // Gapless Prebuffering Check (at 85% completion)
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.85) {
      const nextIdx = queueIndex + 1;
      if (nextIdx < queue.length && prebufferedIndexRef.current !== nextIdx) {
        prebufferedIndexRef.current = nextIdx;
        const nextTrackItem = queue[nextIdx];
        fetch(`/api/stream?id=${nextTrackItem.youtubeId}&bitrate=${userSettings.bitrate}`).catch(() => {});
      }
    }
  }, [currentTime, duration, queueIndex, queue, userSettings.bitrate]);

  // Resolve and start track playback
  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      // Record skip telemetry if previous track skipped before completion
      if (currentTrack && currentTrack.id !== track.id && duration > 0) {
        const ratio = currentTime / duration;
        if (ratio < 0.7) {
          emitTelemetryBeacon({
            trackId: currentTrack.id,
            event: 'track_skip',
            progressSeconds: currentTime,
            durationSeconds: duration,
          });
        }
      }

      if (audioGraphRef.current) {
        await audioGraphRef.current.resume();
      }

      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);
      prebufferedIndexRef.current = null;
      trackStartTimeRef.current = Date.now();
      lastProgressTrackRef.current = track.id;

      // Ensure track is synced into database
      fetch('/api/tracks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnail: track.thumbnail,
        }),
      }).catch(() => {});

      const baseTitle = cleanNorm(track.title);

      // Sanitize queue: strictly filter out alternate versions or lyric clones of the current playing song!
      let initialQueue: Track[] = [];
      if (newQueue && newQueue.length > 0) {
        initialQueue = newQueue.filter((t) => {
          if (t.youtubeId === track.youtubeId) return true;
          const tBase = cleanNorm(t.title);
          return tBase !== baseTitle;
        });
      } else {
        initialQueue = [track];
      }

      setQueue(initialQueue);
      const initialIdx = initialQueue.findIndex((t) => t.youtubeId === track.youtubeId);
      setQueueIndex(initialIdx >= 0 ? initialIdx : 0);

      // Automatically fetch similar songs with respect to the currently playing song!
      fetch(
        `/api/tracks/similar?youtubeId=${track.youtubeId}&title=${encodeURIComponent(
          track.title
        )}&artist=${encodeURIComponent(track.artist)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.tracks && data.tracks.length > 0) {
            setQueue((prevQueue) => {
              const seenIds = new Set(prevQueue.map((q) => q.youtubeId));
              const seenKeys = new Set(prevQueue.map((q) => `${cleanNorm(q.artist)}:::${cleanNorm(q.title)}`));

              const freshSimilar = data.tracks.filter((st: Track) => {
                const stKey = `${cleanNorm(st.artist)}:::${cleanNorm(st.title)}`;
                const stBase = cleanNorm(st.title);
                return (
                  stBase !== baseTitle &&
                  !seenIds.has(st.youtubeId) &&
                  !seenKeys.has(stKey)
                );
              });

              if (freshSimilar.length > 0) {
                return [...prevQueue, ...freshSimilar];
              }
              return prevQueue;
            });
          }
        })
        .catch(() => {});

      // Emit track_start
      emitTelemetryBeacon({
        trackId: track.id,
        event: 'track_start',
        progressSeconds: 0,
        durationSeconds: track.duration,
      });

      // Resolve audio stream
      try {
        const res = await fetch(`/api/stream?id=${track.youtubeId}&bitrate=${userSettings.bitrate}`);
        const streamData = await res.json();

        if (streamData.audioUrl && streamData.source === 'direct' && audioElementRef.current) {
          setPlaybackMode('direct');
          audioElementRef.current.src = streamData.audioUrl;
          audioElementRef.current.load();

          if (userSettings.crossfade > 0 && audioGraphRef.current) {
            audioGraphRef.current.fadeIn(Math.min(userSettings.crossfade, 3));
          }

          audioElementRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              setPlaybackMode('iframe');
              setIsPlaying(true);
            });
        } else {
          setPlaybackMode('iframe');
          if (audioElementRef.current) {
            audioElementRef.current.pause();
          }
          setIsPlaying(true);
        }
      } catch {
        setPlaybackMode('iframe');
        setIsPlaying(true);
      }
    },
    [currentTrack, currentTime, duration, userSettings.bitrate, userSettings.crossfade]
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      if (playbackMode === 'direct' && audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioGraphRef.current) {
        audioGraphRef.current.resume();
      }
      if (playbackMode === 'direct' && audioElementRef.current) {
        audioElementRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, playbackMode, queue, playTrack]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration));
      setCurrentTime(clamped);

      if (playbackMode === 'direct' && audioElementRef.current) {
        audioElementRef.current.currentTime = clamped;
      } else {
        setIframeSeekTime(clamped);
      }
    },
    [duration, playbackMode]
  );

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    const nextSong = queue[nextIdx];
    playTrack(nextSong, queue);
  }, [queue, queueIndex, playTrack]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx], queue);
  }, [queue, queueIndex, currentTime, seek, playTrack]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);

    if (audioGraphRef.current) {
      audioGraphRef.current.setVolume(clamped);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      if (audioGraphRef.current) {
        audioGraphRef.current.setVolume(0);
      }
    }
  }, [isMuted, volume, setVolume]);

  const toggleLike = useCallback(
    (track: Track) => {
      const nextLiked = !likedTrackIds.has(track.id) && !likedTrackIds.has(track.youtubeId);
      setLikedTrackIds((prev) => {
        const copy = new Set(prev);
        if (nextLiked) {
          copy.add(track.id);
          copy.add(track.youtubeId);
        } else {
          copy.delete(track.id);
          copy.delete(track.youtubeId);
        }
        return copy;
      });

      fetch('/api/tracks/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          isLiked: nextLiked,
          trackData: {
            youtubeId: track.youtubeId,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            thumbnail: track.thumbnail,
          },
        }),
      }).catch(() => {
        setLikedTrackIds((prev) => {
          const copy = new Set(prev);
          if (nextLiked) {
            copy.delete(track.id);
            copy.delete(track.youtubeId);
          } else {
            copy.add(track.id);
            copy.add(track.youtubeId);
          }
          return copy;
        });
      });
    },
    [likedTrackIds]
  );

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const reorderQueue = useCallback((newQueue: Track[]) => {
    setQueue(newQueue);
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => prev.filter((_, i) => i !== index));
      if (index === queueIndex) {
        nextTrack();
      } else if (index < queueIndex) {
        setQueueIndex((prev) => prev - 1);
      }
    },
    [queueIndex, nextTrack]
  );

  const syncSettingsToBackend = useCallback((settings: UserSettings) => {
    if (settingsSyncTimerRef.current) clearTimeout(settingsSyncTimerRef.current);
    settingsSyncTimerRef.current = setTimeout(() => {
      fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      }).catch(() => {});
    }, 1000);
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      setUserSettings((prev) => {
        const merged = { ...prev, ...newSettings };
        localStorage.setItem('obsidian_settings', JSON.stringify(merged));
        syncSettingsToBackend(merged);
        return merged;
      });
    },
    [syncSettingsToBackend]
  );

  const setEqBandGain = useCallback(
    (index: number, db: number) => {
      setUserSettings((prev) => {
        const bands = [...prev.eqBands];
        bands[index] = db;
        const merged: UserSettings = { ...prev, eqBands: bands, eqPreset: 'Custom' };
        localStorage.setItem('obsidian_settings', JSON.stringify(merged));
        syncSettingsToBackend(merged);
        return merged;
      });
    },
    [syncSettingsToBackend]
  );

  const setEqPreset = useCallback(
    (presetName: EQPresetName) => {
      const presetBands = EQ_PRESETS[presetName];
      if (!presetBands) return;

      setUserSettings((prev) => {
        const merged: UserSettings = {
          ...prev,
          eqPreset: presetName,
          eqBands: [...presetBands],
        };
        localStorage.setItem('obsidian_settings', JSON.stringify(merged));
        syncSettingsToBackend(merged);
        return merged;
      });
    },
    [syncSettingsToBackend]
  );

  // HTML5 audio event handlers
  const handleTimeUpdate = () => {
    if (audioElementRef.current && playbackMode === 'direct') {
      setCurrentTime(audioElementRef.current.currentTime);
      if (audioElementRef.current.duration) {
        setDuration(audioElementRef.current.duration);
      }
    }
  };

  const handleTrackEnded = () => {
    if (currentTrack) {
      emitTelemetryBeacon({
        trackId: currentTrack.id,
        event: 'track_complete',
        progressSeconds: duration,
        durationSeconds: duration,
      });
    }
    nextTrack();
  };

  const handleAudioError = () => {
    console.warn('Direct audio stream failed, falling back to YouTube iframe player');
    setPlaybackMode('iframe');
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume: isMuted ? 0 : volume,
        isMuted,
        playbackMode,
        userSettings,
        queue,
        queueIndex,
        likedTrackIds,
        isLyricsOpen,
        isQueueOpen,
        isFullPlayerOpen,
        visualizerData,
        playTrack,
        togglePlay,
        seek,
        nextTrack,
        prevTrack,
        setVolume,
        toggleMute,
        toggleLike,
        addToQueue,
        reorderQueue,
        removeFromQueue,
        updateSettings,
        setEqBandGain,
        setEqPreset,
        setIsLyricsOpen,
        setIsQueueOpen,
        setIsFullPlayerOpen,
      }}
    >
      <audio
        ref={audioElementRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnded}
        onError={handleAudioError}
        crossOrigin="anonymous"
        preload="auto"
      />

      <HiddenYouTubeFallback
        videoId={playbackMode === 'iframe' && currentTrack ? currentTrack.youtubeId : null}
        isPlaying={isPlaying && playbackMode === 'iframe'}
        volume={isMuted ? 0 : volume}
        seekTime={iframeSeekTime}
        onTimeUpdate={(cur, dur) => {
          if (playbackMode === 'iframe') {
            setCurrentTime(cur);
            setDuration(dur);
          }
        }}
        onEnded={handleTrackEnded}
        onError={() => {
          console.error('YouTube iframe playback error');
          nextTrack();
        }}
      />

      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
