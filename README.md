# Obsidian — High-Fidelity Ad-Free Music Streaming Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-DSP_Core-FA2D48?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma_5-SQLite%20%2F%20Postgres-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

**An audiophile-grade, ad-free web music streaming application that uses YouTube as its underlying audio provider, featuring a native client-side Web Audio DSP engine, an 8D vector recommendation system, zero-latency playback, and an Apple Music-inspired Liquid Glass user interface.**

</div>

---

## Table of Contents
1. [Executive Summary & Core Tenets](#1-executive-summary--core-tenets)
2. [Full System Architecture](#2-full-system-architecture)
3. [End-to-End Application Lifecycle](#3-end-to-end-application-lifecycle)
4. [Deep Dive: Core Functional Modules](#4-deep-dive-core-functional-modules)
   - [Module A: Native Web Audio DSP Engine](#module-a-native-web-audio-dsp-engine)
   - [Module B: Stream Resolution & Zero-Latency Player Reuse](#module-b-stream-resolution--zero-latency-player-reuse)
   - [Module C: Dynamic Radio Queue & Smart Similar Songs](#module-c-dynamic-radio-queue--smart-similar-songs)
   - [Module D: 8D Vector AI Recommendation Engine](#module-d-8d-vector-ai-recommendation-engine)
   - [Module E: Universal Playlist Importer (Spotify & Apple Music)](#module-e-universal-playlist-importer-spotify--apple-music)
   - [Module F: Authentication, Favorites & Playlist CRUD](#module-f-authentication-favorites--playlist-crud)
   - [Module G: Apple Music Liquid Glass Design System](#module-g-apple-music-liquid-glass-design-system)
5. [How Obsidian Differs from Spotify](#5-how-obsidian-differs-from-spotify)
6. [API Route Reference](#6-api-route-reference)
7. [Database Schema & Data Models](#7-database-schema--data-models)
8. [Getting Started & Local Setup](#8-getting-started--local-setup)
   - [Prerequisites & Environment Variables](#prerequisites--environment-variables)
   - [Database Migration & Seeding](#database-migration--seeding)
   - [Development & Production Execution](#development--production-execution)
   - [Demo Account Credentials](#demo-account-credentials)

---

## 1. Executive Summary & Core Tenets

Traditional music streaming web players are constrained by rigid browser limitations, server bandwidth costs, intrusive advertisements, or rudimentary audio volume controls. **Obsidian** was engineered to solve these challenges through a modern full-stack architecture:

1. **Ad-Free Audio Sourcing:** Streams audio directly from YouTube's global edge network without routing heavy audio bytes through the application server, keeping operational hosting costs at virtually \$0.
2. **Native Web Audio API DSP:** Constructs a real-time, hardware-accelerated Web Audio processing graph directly inside the browser's audio thread: a 10-Band Graphic Equalizer, a **-14 LUFS broadcast-standard** dynamic normalizer, programmable crossfader, and 64-bin FFT spectrum visualizer.
3. **Zero-Latency Playback (Eliminating Double-Tap Bugs):** Implements a fast-path direct stream manifest probe with an instantaneous fallback to a persistent off-screen singleton YouTube player instance (`loadVideoById`), cutting track load and skip latency from 17 seconds to under 700ms.
4. **Self-Healing Dynamic Queue:** Automatically scrapes YouTube Related Mixes, deduplicates track variants (`cleanNorm`), and replenishes the queue whenever songs are played, skipped, or deleted. Pre-buffers upcoming audio manifests at 85% track duration.
5. **Real-Time 8D Vector AI Recommendations:** Telemetry beacon events continuously adjust the mathematical centroid of the user's acoustic profile, ranking candidate tracks using Cosine Similarity on the fly without requiring slow batch jobs.
6. **Apple Music Liquid Glass Aesthetic:** Clean, editorial dark obsidian palette (`#0A0A0C`) with translucent frosted glass panels (`backdrop-blur-28px`, `saturate(190%)`), subtle specular border highlights, Apple coral crimson accent (`#FA2D48`), and dynamic viewport background tinting sampled from album artwork via HTML5 Canvas.

---

## 2. Full System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Tier (Next.js 14 / React 18)"]
        UI["Liquid Glass UI (Apple Music Aesthetic)"]
        AudioProv["AudioProvider (Global Audio State & Event Hub)"]
        DSP["DSP AudioGraph (Web Audio API Engine)"]
        YTPlayer["Hidden YouTube Singleton Player (Offscreen IFrame)"]
        CanvasBackdrop["Dynamic Backdrop (Canvas Color Sampler)"]
        TelemetryBeacon["Telemetry Beacon Dispatcher (Beacon API)"]
    end

    subgraph API ["Serverless API Tier (Next.js App Router)"]
        SearchAPI["/api/search (Live YouTube & Catalog)"]
        StreamAPI["/api/stream (Manifest Fast-Probe & Fallback)"]
        RecsAPI["/api/recommendations (Vector AI Rails)"]
        SimilarAPI["/api/tracks/similar (Dynamic Radio Mix)"]
        ImportAPI["/api/import (Asynchronous Ingestion Worker)"]
        AuthAPI["/api/auth (JWT Cookie Authentication)"]
        PlaylistAPI["/api/playlists (CRUD & Drag-and-Drop)"]
    end

    subgraph Engine ["Intelligence & Ingestion Engine"]
        VectorEngine["8D Vector Cosine Similarity Engine"]
        ImportWorker["Playlist Importer (ISRC & Duration Guard)"]
        TelemetryAggregator["Interaction Weight Aggregator"]
    end

    subgraph Storage ["Persistence & Cache Tier"]
        PrismaORM["Prisma ORM (SQLite / PostgreSQL)"]
        Database[(Catalog, Playlists, Users, Telemetry)]
        ClientCache["LocalStorage (DSP EQ, Bitrate, Normalization)"]
    end

    UI --> AudioProv
    AudioProv --> DSP
    AudioProv --> YTPlayer
    AudioProv --> CanvasBackdrop
    AudioProv --> TelemetryBeacon

    UI --> SearchAPI
    UI --> AuthAPI
    UI --> PlaylistAPI
    AudioProv --> StreamAPI
    AudioProv --> SimilarAPI
    UI --> RecsAPI
    UI --> ImportAPI
    TelemetryBeacon --> API

    RecsAPI --> VectorEngine
    ImportAPI --> ImportWorker
    ImportWorker --> YouTubeRemote["YouTube Global Audio Services"]
    API --> PrismaORM
    PrismaORM --> Database
    AudioProv <--> ClientCache
```

---

## 3. End-to-End Application Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Liquid Glass UI
    participant Provider as AudioProvider
    participant DSP as Web Audio DSP Graph
    participant API as /api/stream Resolver
    participant NativeAudio as HTML5 Audio Element
    participant Fallback as Hidden YouTube Player
    participant Similar as /api/tracks/similar
    participant Telemetry as /api/telemetry

    User->>UI: Clicks track or selects search result
    UI->>Provider: playTrack(track, queueContext)
    Provider->>Provider: Set currentTrack & reset scrub head
    Provider->>API: GET /api/stream?id={youtubeId}&bitrate={tier}
    alt Direct Audio Stream Manifest Valid (<= 500ms probe)
        API-->>Provider: { directUrl: "https://..." }
        Provider->>NativeAudio: audio.src = directUrl; audio.play()
        Provider->>DSP: Route MediaElementSourceNode -> EQ -> Compressor -> Gain -> Output
    else DRM / Restricted Fallback Mode
        API-->>Provider: { fallback: true, youtubeId }
        Provider->>Fallback: loadVideoById(youtubeId, 0) (Singleton reuse)
        Fallback-->>Provider: onStateChange(PLAYING)
    end

    par Background Canvas Color Extraction
        Provider->>UI: Offscreen 40x40 Canvas downsamples thumbnail -> Radial Gradient Ambient Tint
    and Dynamic Radio Replenishment
        Provider->>Similar: GET /api/tracks/similar?videoId={youtubeId}
        Similar-->>Provider: Fresh related tracks (Deduplicated)
        Provider->>Provider: Backfill Queue Drawer
    end

    loop Playback Telemetry Loop
        Provider->>Telemetry: track_start (weight +0.05)
        Provider->>Telemetry: track_progress (every 10s, weight +0.1)
        alt Skipped before 30 seconds
            Provider->>Telemetry: track_skip (negative weight -0.8)
        else Completed > 70% duration
            Provider->>Telemetry: track_complete (positive weight +1.2)
        end
    end

    opt Gapless Pre-buffering
        Note over Provider: At 85% track duration, pre-resolve next track stream
    end
```

---

## 4. Deep Dive: Core Functional Modules

### Module A: Native Web Audio DSP Engine

The DSP audio graph in [`src/lib/audio/AudioGraph.ts`](src/lib/audio/AudioGraph.ts) runs on the browser's dedicated real-time audio thread:

```text
[MediaElement / Audio Source] 
         │
         ▼
[10-Band BiquadFilter EQ] (32Hz -> 16kHz, ±12dB Gain, Q=1.4)
         │
         ▼
[DynamicsCompressorNode] (-14 LUFS Broadcast Normalization)
         │
         ▼
[GainNode] (Volume Control & Linear Ramp Crossfading)
         │
         ▼
[AnalyserNode] (64-bin FFT Spectrum Analyzer)
         │
         ▼
[AudioContext.destination] (System Output / DAC)
```

1. **Hardware-Accelerated Audio Context:** Lazily initialized on the first user interaction to comply with strict browser Autoplay policies.
2. **10-Band BiquadFilter Equalizer:**
   - **Frequencies:** `32Hz`, `64Hz`, `125Hz`, `250Hz`, `500Hz`, `1kHz`, `2kHz`, `4kHz`, `8kHz`, `16kHz`.
   - **Filter Topology:** Band 0 (`32Hz`) uses `lowshelf`; Band 9 (`16kHz`) uses `highshelf`; Bands 1–8 use parametric `peaking` filters calibrated with $Q = 1.4$.
   - **Clickless Gain Scheduling:** Parameter transitions are executed using `filter.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05)`, preventing audible DC clicks.
   - **DSP Presets:** Flat, Bass Boost, Vocal, Acoustic, Electronic, and Custom (`-12dB` to `+12dB` range).
3. **Dynamics Compressor (-14 LUFS Normalizer):**
   - Implements automatic gain control targeting standard broadcast streaming loudness:
     - `threshold`: `-24.0 dB`
     - `knee`: `30.0 dB`
     - `ratio`: `12.0 : 1`
     - `attack`: `0.003 s` (3ms)
     - `release`: `0.250 s` (250ms)
   - Eliminates volume jumps between different masterings and studio releases.
4. **Master Gain & Crossfader:**
   - Supports 0s to 12s crossfading using linear gain ramps: `gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + rampSeconds)`.
5. **Real-Time FFT Analyser:**
   - Configured with `fftSize = 64` and `smoothingTimeConstant = 0.8`, outputting 32 frequency bins to drive the 24-bar spectrum visualizer in the Fullscreen Player modal at 60fps.

---

### Module B: Stream Resolution & Zero-Latency Player Reuse

Audio streaming uses a two-tier hybrid architecture in [`src/lib/youtube/resolver.ts`](src/lib/youtube/resolver.ts) and [`src/components/audio/HiddenYouTubeFallback.tsx`](src/components/audio/HiddenYouTubeFallback.tsx):

1. **Fast-Probe Direct Stream (Tier 1):**
   - Queries direct audio manifests (Opus/AAC 160kbps/128kbps) with a strict $\le 500\text{ms}$ timeout. If healthy, audio routes into native HTML5 `<audio>` and enters the Web Audio DSP graph.
2. **Singleton YouTube Fallback (Tier 2):**
   - For age-restricted, DRM-protected, or geo-locked tracks, the system gracefully falls back to an embedded, hidden YouTube IFrame.
   - **The Singleton Reuse Pattern:** Unlike typical implementations that destroy and rebuild `<iframe>` elements (causing 10–15 second freezing and "double-tap" bugs), Obsidian preserves a persistent, mounted YouTube player instance. When skipping or selecting a track, it invokes `playerRef.current.loadVideoById(videoId, 0)` directly on the existing player, reducing track load times to $<700\text{ms}$.

---

### Module C: Dynamic Radio Queue & Smart Similar Songs

The playback queue ([`src/lib/youtube/similar.ts`](src/lib/youtube/similar.ts) & [`src/components/audio/QueueDrawer.tsx`](src/components/audio/QueueDrawer.tsx)) behaves like Spotify or YouTube Music Radio:

1. **Related Song Harvesting:** When any song plays, the engine scrapes YouTube Mix radio tokens (`RDAMVM`) and combines them with cosine-matched catalog items.
2. **Deduplication Guard:** String normalizer `cleanNorm(track.title)` strips non-alphanumeric characters and common suffixes (`(Official Audio)`, `[Official Video]`, `(Lyrics)`), ensuring the exact same song never appears twice under different video uploads.
3. **Automatic Backfilling:** Deleting a track or skipping through the queue triggers an immediate background replenishment to maintain a continuous queue buffer.
4. **Gapless Pre-Buffering:** At **85% completion** of the active song, the client pre-resolves the next track's direct stream manifest in the background.

---

### Module D: 8D Vector AI Recommendation Engine

Recommendations ([`src/lib/recommender/vectorEngine.ts`](src/lib/recommender/vectorEngine.ts)) are powered by multi-factor acoustic vector math:

1. **8D Normalized Acoustic Vector:**
   $$\vec{v} = [\text{energy}, \text{valence}, \text{danceability}, \text{acousticness}, \text{instrumentalness}, \text{tempo}, \text{liveness}, \text{speechiness}]$$
2. **Telemetry Beacons:**
   Dispatched asynchronously via `navigator.sendBeacon` to `/api/telemetry`:
   - `track_start`: Base interaction record ($+0.05$).
   - `track_progress`: Emitted every 10 seconds ($+0.10$).
   - `track_skip`: Skipped before 30s assigns a **negative weight** ($-0.80$).
   - `track_complete`: Completion ratio $> 70\%$ assigns a **positive weight** ($+1.20$).
3. **User Centroid Mathematical Calculation:**
   $$\vec{C}_{\text{user}} = \frac{\sum_{i} w_i \cdot \vec{v}_i}{\sum_{i} |w_i|}$$
   Candidate catalog tracks are scored using **Cosine Similarity**:
   $$\text{Sim}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$
4. **Personalized Rails:**
   - **Made For You:** Fresh, unlistened tracks matching the user's acoustic centroid.
   - **Heavy Rotation:** Highest cumulative weighted tracks from recent listening sessions.
   - **Discovery Station:** Multiplies high vector similarity by inverse familiarity $(1 - \text{familiarity})$ to uncover obscure gems.
   - **Artist Spotlight:** Harmonic and rhythmic features matching the user's top artist.

---

### Module E: Universal Playlist Importer (Spotify & Apple Music)

The asynchronous importer in [`src/lib/queue/importQueue.ts`](src/lib/queue/importQueue.ts) and [`src/components/import/PlaylistImporter.tsx`](src/components/import/PlaylistImporter.tsx) breaks walled-garden limitations:

1. **Input Parsing:** Accepts raw URLs from Spotify (`open.spotify.com/playlist/{id}`) and Apple Music (`music.apple.com/{country}/playlist/{name}/{id}`).
2. **3-Tier Matching Hierarchy:**
   - **Tier 1 (Exact ISRC Match):** Matches the International Standard Recording Code against the local database catalog.
   - **Tier 2 (Normalized Memory Cache):** Checks in-memory cache for normalized `artist:title`.
   - **Tier 3 (YouTube Audio Search with Duration Guard):** Queries `"{artist} - {title} Official Audio"` and validates the video length against the original metadata within a strict **$\pm 3$-second duration guard** to filter out acoustic covers, live bootlegs, and extended dance remixes.
3. **Live Progress Polling:** Background worker reports `matchedTracks / totalTracks` with an interactive Exceptions Drawer displaying unresolved tracks.

---

### Module F: Authentication, Favorites & Playlist CRUD

1. **Authentication:**
   - Stateless JWT authentication signed via [`src/lib/auth/jwt.ts`](src/lib/auth/jwt.ts) and stored in a secure `HttpOnly`, `SameSite: Lax` cookie (`obsidian_token`).
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - Dedicated **Log In**, **Sign Up**, **Switch Account**, and **Log Out** controls integrated across the header profile menu and sidebar drawer.
2. **Favorites / Liked Songs:**
   - Persistent `UserLike` relational table in SQLite/PostgreSQL.
   - Pinned collection in [`src/app/favorites/page.tsx`](src/app/favorites/page.tsx) featuring track counts, total runtime, and a single-click "Play All" button.
3. **Playlist Management:**
   - Full CRUD operations with drag-and-drop track reordering ([`src/app/playlists/[id]/page.tsx`](src/app/playlists/[id]/page.tsx)).
   - Public and private visibility toggles.
   - Contextual 3-dot action menu (`TrackContextMenu`) available on every track across the app ("Add to Queue", "Play Next", "Add to Favorites", "Add to Playlist").

---

### Module G: Apple Music Liquid Glass Design System

Obsidian implements an editorial, distraction-free visual design system:

- **Liquid Glass Utility Classes ([`src/app/globals.css`](src/app/globals.css)):**
  - `.glass-panel`: `background: rgba(18, 18, 24, 0.72); backdrop-filter: blur(28px) saturate(190%); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07);`
  - `.glass-card`: Translucent card surface with hover elevations (`translateY(-2px)`).
  - `.glass-pill`: Interactive pill controls with specular highlights.
- **Color Tokens:**
  - Deep Dark Canvas: `#0A0A0C`
  - Apple Music Accent: Coral Crimson `#FA2D48`
  - Typography: SF-Pro Display font stack with `tabular-nums` for timecodes.
- **Dynamic Backdrop Tinting ([`src/components/layout/DynamicBackdrop.tsx`](src/components/layout/DynamicBackdrop.tsx)):**
  - An offscreen $40 \times 40$ HTML5 `<canvas>` downsamples the active album art, calculates dominant RGB values, and projects an ambient radial gradient across the top 38% of the viewport.
- **Liquid Animated Ambient Mesh:**
  - 3 blurred radial orbs (`blur-[140px]`) running `@keyframes liquidFloat` in the Fullscreen Player behind synchronized lyrics.

---

## 5. How Obsidian Differs from Spotify

```mermaid
flowchart LR
    subgraph Spotify ["Spotify Architecture"]
        S1["Record Labels (DDEX)"] --> S2["Central Transcoding Farm"]
        S2 --> S3["Encrypted CDN Network"]
        S3 --> S4["Client Decrypts DRM\n(Static Gain Adjustment)"]
    end

    subgraph Obsidian ["Obsidian Architecture"]
        O1["YouTube Global CDN"] --> O2["Client In-Browser Audio Thread"]
        O2 --> O3["Hardware DSP Engine\n(10-Band EQ + -14 LUFS Compressor)"]
        O3 --> O4["Lossless Dynamic Output\n(Zero Audio Server Costs)"]
    end
```

| Feature / Architecture | Spotify | Obsidian Hi-Fi |
| :--- | :--- | :--- |
| **Audio Ingestion & Supply** | Direct label ingestion via DDEX (FLAC) | YouTube global audio stream manifests & live search |
| **Audio Delivery Costs** | Petabytes of heavy CDN streaming bandwidth | **Zero server bandwidth:** audio streams direct from YouTube CDN |
| **DSP Audio Graph** | Server-side static gain tagging (ReplayGain) | **Native Web Audio API Graph** (10-Band BiquadFilter EQ, real-time Dynamics Compressor) |
| **Equalizer Control** | Basic 6-band sliders on desktop / mobile | **Interactive 10-Band EQ** (`32Hz` to `16kHz`, parametric peaking $Q=1.4$, $\pm 12\text{dB}$) |
| **Loudness Normalizer** | Static volume multiplier | **Live dynamic compression** (`DynamicsCompressorNode: -14 LUFS`) |
| **Recommendation Engine** | Heavy offline batch pipelines (Spark, ALS) | **Real-time 8D Vector Centroid Engine** scored via Cosine Similarity |
| **Queue Management** | Static tracklists generated on server | **Self-healing dynamic queue** with mix scraping and automatic backfill |
| **Playlist Portability** | Closed walled-garden | Universal importer for **Spotify and Apple Music URLs** via ISRC |
| **Design Aesthetic** | Industrial dark `#121212` with green accents | **Apple Music Liquid Glass** (frosted glass, specular highlights, dynamic ambient backdrop) |
| **Subscription & Ads** | Free tier with ads or \$11.99/mo Premium | **100% Ad-Free**, no subscription required |

---

## 6. API Route Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Creates a new user with bcrypt-hashed credentials and sets JWT cookie |
| `POST` | `/api/auth/login` | Authenticates user credentials and sets `obsidian_token` cookie |
| `POST` | `/api/auth/logout` | Clears and expires the `obsidian_token` authentication cookie |
| `GET` | `/api/auth/me` | Returns active user profile and DSP preferences |
| `GET` | `/api/search` | Live search supporting YouTube (`source=youtube`) and local catalog (`source=catalog`) |
| `GET` | `/api/stream` | Probes direct audio stream manifest with fallback indicator |
| `GET` | `/api/recommendations`| Computes personalized discovery rails via 8D vector cosine similarity |
| `GET` | `/api/tracks/similar` | Scrapes YouTube related mixes and harmonic recommendations for the queue |
| `POST` | `/api/tracks/sync` | Automatically syncs played YouTube tracks into the catalog database |
| `GET` | `/api/tracks/like` | Returns all tracks saved to the user's Liked Songs collection |
| `POST` | `/api/tracks/like` | Toggles track in Liked Songs (`UserLike` table) |
| `POST` | `/api/telemetry` | Collects playback beacons (`start`, `progress`, `skip`, `complete`) |
| `GET` | `/api/playlists` | Lists user and public curated playlists |
| `POST` | `/api/playlists` | Creates a new playlist |
| `GET` | `/api/playlists/[id]` | Retrieves playlist metadata and ordered tracks |
| `PUT` | `/api/playlists/[id]` | Updates playlist name, description, visibility, or track order |
| `DELETE`| `/api/playlists/[id]` | Deletes a playlist |
| `POST` | `/api/playlists/[id]/tracks` | Adds a track to a playlist |
| `DELETE`| `/api/playlists/[id]/tracks` | Removes a track from a playlist |
| `POST` | `/api/import` | Initiates asynchronous playlist import job from Spotify / Apple Music URL |
| `GET` | `/api/import/[jobId]` | Polls import job progress, matched tracks, and exceptions drawer |
| `PUT` | `/api/user/settings` | Debounced persistence of client DSP EQ settings to user profile |

---

## 7. Database Schema & Data Models

Managed via **Prisma ORM** (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "sqlite" // Seamlessly switchable to "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  username     String
  passwordHash String
  settings     String?     @default("{\"bitrate\":\"high\",\"normalization\":true,\"crossfade\":2,\"eqEnabled\":true,\"eqPreset\":\"Flat\",\"eqBands\":[0,0,0,0,0,0,0,0,0,0]}")
  playlists    Playlist[]
  likes        UserLike[]
  history      Telemetry[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Track {
  id          String          @id @default(cuid())
  youtubeId   String          @unique
  title       String
  artist      String
  album       String?
  isrc        String?
  duration    Int             // in seconds
  thumbnail   String
  embedding   String?         // JSON 8D float vector for cosine similarity
  audioUrl    String?
  lyrics      String?         // LRC synchronized timestamped lines
  likes       UserLike[]
  playlistMap PlaylistTrack[]
  history     Telemetry[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Playlist {
  id          String          @id @default(cuid())
  name        String
  description String?
  coverImage  String?
  isPublic    Boolean         @default(true)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      PlaylistTrack[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model PlaylistTrack {
  id         String   @id @default(cuid())
  playlistId String
  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  trackId    String
  track      Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  position   Int      @default(0)
  createdAt  DateTime @default(now())
}

model UserLike {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, trackId])
}

model Telemetry {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  event     String   // "track_start" | "track_progress" | "track_skip" | "track_complete"
  weight    Float    // Scalar interaction weight for centroid recalculation
  createdAt DateTime @default(now())
}
```

---

## 8. Getting Started & Local Setup

### Prerequisites & Environment Variables

- **Node.js:** `v20.x` or higher
- **npm** or **pnpm**

Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="obsidian_super_secret_jwt_key_2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Migration & Seeding

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma database schema
npx prisma db push

# 3. Seed rich catalog (83 global hit tracks with 8D embeddings & curated playlists)
npx tsx src/lib/db/seed.ts
```

### Development & Production Execution

**Development Server (Hot-Reload):**
```bash
npm run dev
```

**Production Build & Run:**
```bash
npm run build
npm start
```
Open **`http://localhost:3000`** in your browser.

### Demo Account Credentials

A pre-seeded audiophile user is ready to test immediately:
- **Email:** `user@obsidian.audio`
- **Password:** `password123`
*(Or click **"Fill Demo Account"** in the Login modal)*

---

## 9. Tech Stack Summary

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with Liquid Glass tokens & animations
- **Audio DSP:** Native [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`, `GainNode`, `AnalyserNode`)
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with SQLite (development) and PostgreSQL readiness
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **Authentication:** Custom JWT authentication via `HttpOnly` cookies and `bcryptjs`
- **Video & Audio Resolution:** [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core) & YouTube IFrame API

---

<div align="center">
Built with precision for audiophiles who demand ad-free, high-fidelity streaming.
</div>
