import { TelemetryPayload } from '@/types';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sessionId = localStorage.getItem('webify_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('webify_session_id', sessionId);
    }
    // Ensure cookie is available for SSR/API requests
    if (!document.cookie.includes('webify_session_id=')) {
      document.cookie = `webify_session_id=${sessionId}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return sessionId;
  } catch {
    return 'sess_fallback';
  }
}

export function emitTelemetryBeacon(payload: TelemetryPayload) {
  if (typeof window === 'undefined') return;

  if (!payload.sessionId) {
    payload.sessionId = getOrCreateSessionId();
  }

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const success = navigator.sendBeacon('/api/telemetry', blob);
    if (success) return;
  }

  // Fallback to fetch with keepalive
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Silent fail for non-critical telemetry
  });
}

