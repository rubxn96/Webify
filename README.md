# Obsidian — High-Fidelity Ad-Free Music Streaming Application

An editorial, audiophile-grade web music streaming platform powered by Next.js 14, Web Audio API DSP pipeline, Prisma ORM, and YouTube audio resolution.

---

## 1. Architectural Highlights

### Audio & DSP Core (`Web Audio API`)
- **Unified Audio Graph:**
  ```text
  [Source Audio / MediaElement] 
    └─> [10-Band BiquadFilter EQ]
         └─> [DynamicsCompressorNode (Normalizer: -14 LUFS baseline)]
              └─> [GainNode (Crossfade/Volume)]
                   └─> [AnalyserNode (Visualizer)]
                        └─> [AudioContext.destination]
  ```
- **Stream Resolution & Resilience:**
  - Client queries `/api/stream?id=...` which queries direct audio manifests.
  - For DRM-restricted, age-restricted, or geo-locked tracks, smoothly transitions to `HiddenYouTubeFallback` (an embedded, offscreen YouTube IFrame API instance) with seamless play/pause/seek API controls.
- **DSP 10-Band Equalizer:**
  - 10 frequency bands: `32Hz`, `64Hz`, `125Hz`, `250Hz`, `500Hz`, `1kHz`, `2kHz`, `4kHz`, `8kHz`, `16kHz`.
  - Presets: `Flat`, `Bass Boost`, `Vocal`, `Acoustic`, `Electronic`, `Custom`.
  - Gain range: `-12dB` to `+12dB` with real-time audio graph updating.
- **Audio Normalization:**
  - DynamicsCompressorNode configured to target -14 LUFS baseline (`threshold: -24dB`, `knee: 30`, `ratio: 12`, `attack: 0.003s`, `release: 0.25s`).
- **Gapless Pre-buffering:**
  - Initiates next track stream pre-fetching at 85% track completion.

---

## 2. "Obsidian" Premium Dark UI Design System

- **Color Tokens:**
  - Canvas / Background: `#0A0A0C`
  - Sidebars & Nav: `#121216`
  - Cards & Floating Panels: `#1A1A22`
  - Hover & Active States: `#24242F`
  - Borders & Dividers: `#22222E` (1px subtle border)
  - Typography Primary: `#F4F4F6` (Tight tracking `-0.02em`)
  - Typography Secondary / Subtext: `#8E8E9E`
  - Monospace Numbers: `font-variant-numeric: tabular-nums` for timecodes and track indices
  - Accent Color: Subtle deep crimson `#E11D48`
- **Dynamic Backdrop Tint:**
  - Off-screen `<canvas>` samples dominant colors from the current album art and renders a low-saturation gradient across the top 20% of the viewport:
    `radial-gradient(circle at 50% 0%, rgba(r,g,b, 0.18) 0%, rgba(r,g,b, 0.05) 45%, #0A0A0C 75%)`
- **Synchronized Lyrics:**
  - Real-time LRC time-synced lyrics with auto-scrolling, current line scaling, and click-to-seek.

---

## 3. Asynchronous Playlist Importer (Spotify & Apple Music)

- Supports URLs from Spotify (`open.spotify.com/playlist/...`) and Apple Music (`music.apple.com/...`).
- **3-Tier Matching Engine:**
  1. Exact ISRC match against local catalog.
  2. In-memory / Redis cache for normalized `artist:title`.
  3. YouTube search: `"{artist} - {title} Official Audio"` with a duration guard ($\pm 3$ seconds) to avoid bootlegs, extended mixes, or incorrect covers.
- Real-time progress bar (`X / Total tracks matched`) and an Exceptions Drawer detailing unresolved tracks.

---

## 4. Telemetry & Vector Recommendation Engine

- Emits beacons via `navigator.sendBeacon` and `keepalive: true`:
  - `track_start`: Weight +0.05
  - `track_progress`: Emitted every 10 seconds (Weight +0.1)
  - `track_skip`: Negative weight (-1.0 if skipped before 30s)
  - `track_complete`: Positive weight (+2.0 if completion ratio > 70%)
- **Personalized Rails:**
  - **Hero Shelf:** "Heavy Rotation" session resume.
  - **Quick Access Grid:** 2x3 compact tiles for daily top picks.
  - **Discovery Mix:** 8-dimensional audio vector cosine similarity with low user familiarity.
  - **Artist Spotlight:** "Because you like [Top Artist]".

---

## 5. Getting Started

### Prerequisites
- Node.js 20+

### Database Setup & Seeding
```bash
# Push schema to SQLite/PostgreSQL
npx prisma db push

# Seed with rich audiophile tracks & curated playlists
npx tsx src/lib/db/seed.ts
```

### Running Development Server
```bash
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```
Default URL: `http://localhost:3000`

### Demo Credentials
- Email: `user@obsidian.audio`
- Password: `password123`
*(Or click "Fill Demo Account" on the login modal)*

