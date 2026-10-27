import { TelemetryPayload } from '@/types';

export function emitTelemetryBeacon(payload: TelemetryPayload) {
  if (typeof window === 'undefined') return;

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
