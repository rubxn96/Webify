# Obsidian — High-Fidelity Ad-Free Music Streaming Platform
### 4-Tier Modular Monolith · Mobile Background Playback & Lock-Screen Media Session Engine

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-DSP_Core-FA2D48?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Vector%20%26%20JSON-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_5-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Postgres_16-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**An audiophile-grade, ad-free web music streaming application that uses YouTube as its underlying audio provider, featuring a native client-side Web Audio DSP engine, native iOS/Android mobile background playback, OS lock-screen MediaSession controls, an 8D vector recommendation system, and an Apple Music-inspired Liquid Glass user interface.**

</div>

---

## Table of Contents
1. [Executive Summary & Core Tenets](#1-executive-summary--core-tenets)
2. [4-Tier Modular Monolith Architecture](#2-4-tier-modular-monolith-architecture)
3. [Mobile Background Playback & Lock-Screen Engine](#3-mobile-background-playback--lock-screen-engine)
4. [Deep Dive: Core Functional Modules](#4-deep-dive-core-functional-modules)
   - [Tier 1: Client & Web Audio DSP Engine](#tier-1-client--web-audio-dsp-engine)
   - [Tier 2: Application API & Middleware](#tier-2-application-api--middleware)
   - [Tier 3: Persistence & Recommendation Engine](#tier-3-persistence--recommendation-engine)
   - [Tier 4: Encapsulated YouTube Provider Adapter](#tier-4-encapsulated-youtube-provider-adapter)
5. [Byte-Range Audio Proxy & CORS Architecture](#5-byte-range-audio-proxy--cors-architecture)
6. [How Obsidian Differs from Spotify](#6-how-obsidian-differs-from-spotify)
7. [API Route Reference](#7-api-route-reference)
8. [Database Schema & Data Models](#8-database-schema--data-models)
9. [Step-by-Step Instructions on How to Run](#9-step-by-step-instructions-on-how-to-run)
   - [Prerequisites](#prerequisites)
   - [Step 1: Install Dependencies](#step-1-install-dependencies)
   - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
   - [Step 3: Provision PostgreSQL Database](#step-3-provision-postgresql-database)
     - [Option A: 1-Click Docker Compose (Recommended)](#option-a-1-click-docker-compose-recommended)
     - [Option B: Existing Local or Cloud PostgreSQL (Neon / Supabase / AWS RDS)](#option-b-existing-local-or-cloud-postgresql)
   - [Step 4: Push Prisma Schema & Generate Client](#step-4-push-prisma-schema--generate-client)
   - [Step 5: Seed Database with 8D Vectors & Catalog](#step-5-seed-database-with-8d-vectors--catalog)
   - [Step 6: Start the Application](#step-6-start-the-application)
     - [Running in Development Mode](#running-in-development-mode)
     - [Running in Production Mode](#running-in-production-mode)
   - [Step 7: Testing Mobile Background Audio & Lock-Screen Controls](#step-7-testing-mobile-background-audio--lock-screen-controls)
     - [Local Wi-Fi Network Access](#local-wi-fi-network-access)
     - [Testing on iOS Safari (iPhone / iPad)](#testing-on-ios-safari-iphone--ipad)
     - [Testing on Android (Google Chrome)](#testing-on-android-google-chrome)
     - [PWA Standalone Installation](#pwa-standalone-installation)
10. [Cloud Hosting & Production Deployment](#10-cloud-hosting--production-deployment)
11. [CI/CD Automation & Semantic Versioning](#11-cicd-automation--semantic-versioning)
12. [Default Demo Credentials & Test Accounts](#12-default-demo-credentials--test-accounts)
13. [Troubleshooting & Frequently Asked Questions](#13-troubleshooting--frequently-asked-questions)

---

## 1. Executive Summary & Core Tenets

Traditional music streaming web players are constrained by rigid browser limitations, server bandwidth costs, intrusive advertisements, or rudimentary audio volume controls. When mobile screens turn off or tabs are minimized, mobile operating systems suspend background JavaScript and destroy off-screen iframes.

**Obsidian** was engineered to solve these challenges through a modern **4-Tier Modular Monolith**:

1. **Continuous Mobile Background Audio Playback:** Uninterrupted playback on iOS Safari & Android Chrome when screens lock, turn off, or tabs are minimized, powered by a persistent single `<audio playsInline crossOrigin="anonymous">` element, `AudioContext` auto-resume wake-lock, and OS Lock-Screen / Control Center integration (`navigator.mediaSession`).
2. **Byte-Range CORS Audio Proxy (`/api/stream/proxy`):** Forwarding byte ranges (`206 Partial Content`) with `Accept-Ranges: bytes` and CORS headers directly to client `<audio>` nodes, granting first-party audio streaming for Web Audio API DSP processing without canvas/audio tainting.
3. **Ad-Free Audio Sourcing:** High-reliability `@distube/ytdl-core` manifest resolution with in-memory 45-minute caching and 2500ms probe timeout, cleanly encapsulated behind an adapter interface.
4. **Native Web Audio API DSP:** Hardware-accelerated processing graph inside the browser's audio thread: a 10-Band Graphic Equalizer, a **-14 LUFS broadcast-standard** dynamic normalizer, programmable crossfader, and 64-bin FFT spectrum visualizer.
5. **Self-Healing Dynamic Queue & RDAMVM Radio:** YouTube Mix (`RDAMVM`/`RD`) scraping, canonical title normalization (`cleanNorm`), and dynamic backfilling whenever songs are skipped, played, or removed.
6. **Real-Time 8D Vector AI Recommendations:** Standalone recommendation engine storing native `Float[]` vectors and calculating decayed user persona centroids across PostgreSQL `Telemetry` events.
7. **Apple Music Liquid Glass Aesthetic:** Editorial obsidian palette (`#0A0A0C`) with frosted glass panels (`backdrop-blur-28px`, `saturate(190%)`), crimson coral accent (`#FA2D48`), and dynamic canvas artwork color extraction.

---

## 2. 4-Tier Modular Monolith Architecture

```mermaid
flowchart TD
    subgraph Tier1 ["Tier 1: Obsidian Client (Next.js 14 / TypeScript)"]
        UI["Liquid Glass UI (Apple Music Aesthetic)"]
        AudioProv["AudioProvider (Persistent Single <audio playsInline>)"]
        MediaSess["MediaSession OS Lock-Screen Controller"]
        DSP["AudioGraph DSP (10-Band EQ, -14 LUFS, Crossfader, FFT)"]
        WakeLock["AudioContext Auto-Resume Wake-Lock"]
        VisGuard["Page Visibility Guard (Background Tab Throttling Protection)"]
    end

    subgraph Tier2 ["Tier 2: Application API & Middleware (src/server/)"]
        Validation["Zod Validation Middleware (Register, Login, Playlists, Telemetry)"]
        AuthMiddleware["JWT Cookie & Bearer Authorization"]
        AuthService["AuthService (Bcrypt, JWT, JSON Preferences)"]
        CatalogService["CatalogService (Local Metadata & Provider Search)"]
        PlaylistService["PlaylistService (CRUD, Drag-and-Drop Order)"]
        HistoryService["HistoryService (Interaction Ingestion & Weights)"]
    end

    subgraph Tier3 ["Tier 3: Persistence & Intelligence (src/server/recommendation/ & Prisma)"]
        Postgres[(PostgreSQL: Accounts, Metadata, Playlists, Interactions)]
        TasteProfile["tasteProfile.ts (8D Acoustic Centroid & Temporal Decay)"]
        Ranking["ranking.ts (Cosine Sim, Made For You, Heavy Rotation, Discovery)"]
        Radio["radio.ts (Dynamic Radio Mix Blending: 40% Vector, 30% Mix, 30% Favs)"]
    end

    subgraph Tier4 ["Tier 4: Provider Adapter & Audio Proxy (src/server/providers/)"]
        ProviderAdapter["IMusicProviderAdapter Interface"]
        YTAdapter["YouTubeProviderAdapter (ytdl-core, 45m Cache, 2500ms Probe)"]
        StreamProxy["/api/stream/proxy (206 Partial Content, Range: bytes, CORS *)"]
        MixScraper["RDAMVM YouTube Mix Scraper & cleanNorm Deduplicator"]
        Matcher["±3s Duration-Guarded Importer Matcher"]
    end

    UI --> AudioProv
    AudioProv --> MediaSess
    AudioProv --> DSP
    AudioProv --> WakeLock
    AudioProv --> VisGuard

    AudioProv --> StreamProxy
    UI --> Tier2

    Tier2 --> Tier3
    Tier2 --> Tier4
    Tier3 --> Postgres
    Tier4 --> StreamProxy
```

---

## 3. Mobile Background Playback & Lock-Screen Engine

Mobile browsers kill off-screen `<iframe>` elements and suspend audio threads when the user locks their smartphone or minimizes the browser tab. Obsidian achieves native-grade background playback through five integrated mechanisms:

### A. Persistent Single `<audio>` Node Lifecycle
Rather than unmounting and recreating `<audio>` elements between track transitions, [AudioProvider.tsx](file:///d:/projects/music-project/src/components/audio/AudioProvider.tsx) maintains a single, permanent `<audio playsInline crossOrigin="anonymous" preload="auto">` element across the entire lifecycle of the application. Recreating DOM audio nodes while a smartphone is locked revokes the background audio session; maintaining a single persistent instance ensures continuous OS playback authorization.

### B. OS Lock-Screen Integration (`MediaSession API`)
Full two-way synchronization with the operating system media center:
- **Rich Media Metadata:** Populates `navigator.mediaSession.metadata` with `MediaMetadata` containing high-res (512x512) album art, track title, artist, and album.
- **Hardware & Lock-Screen Controls:** Binds native OS action handlers for:
  - `play` / `pause`
  - `previoustrack` / `nexttrack`
  - `seekto`
  - `seekbackward` (10s) / `seekforward` (10s)
- **Position State Synchronization:** Calls `navigator.mediaSession.setPositionState` continuously during playback so lock-screen scrubbing bars accurately reflect track position.

### C. AudioContext Auto-Resume Wake-Lock
On iOS Safari and Android Chrome, phone calls, system notifications, or lock events trigger `audioContext.state === 'interrupted'` or `'suspended'`. Obsidian registers visibility, focus, and state observers:
```ts
const handleWake = () => {
  if (isPlayingRef.current && audioGraphRef.current) {
    audioGraphRef.current.resume().catch(() => {});
  }
};
document.addEventListener('visibilitychange', handleWake);
window.addEventListener('focus', handleWake);
```
When interruptions clear, the audio graph automatically resumes without requiring user intervention.

### D. Gapless 85% Pre-Buffer Threshold
When track progress reaches **85% of total duration**, the player triggers a background pre-warm of the upcoming track's `/api/stream/proxy` URL. When the current track triggers `onEnded`, the next audio source is already resolved and cached in memory, allowing `audioEl.src = nextProxyUrl; audioEl.play();` to execute synchronously within the media ended lifecycle event, avoiding browser autoplay restrictions.

### E. Page Visibility Guard for Fallback Mode
When playing via the embedded fallback player, Obsidian intercepts `visibilitychange` and `webkitvisibilitychange` events using capturing listeners (`true`), halting event propagation so background tab throttling does not trigger `pauseVideo()`.

---

## 4. Deep Dive: Core Functional Modules

### Tier 1: Client & Web Audio DSP Engine
Located in `src/lib/audio/AudioGraph.ts` and `src/components/audio/AudioProvider.tsx`:
- **10-Band BiquadFilter EQ:** Frequencies: `32Hz`, `64Hz`, `125Hz`, `250Hz`, `500Hz`, `1kHz`, `2kHz`, `4kHz`, `8kHz`, `16kHz` with smooth parameter transitions (`setTargetAtTime`).
- **Broadcast Normalizer:** Hardware `DynamicsCompressorNode` calibrated to **-14 LUFS** (`threshold: -14dB`, `knee: 12dB`, `ratio: 4:1`, `attack: 0.003s`, `release: 0.25s`).
- **Master Crossfader:** Linear ramp gain transitions (`fadeIn`, `fadeOut`) configurable between 0 and 12 seconds.
- **64-Bin FFT AnalyserNode:** Feeds real-time frequency data into spectrum visualizers.

### Tier 2: Application API & Middleware
Located in `src/server/modules/` and `src/server/middleware/`:
- **Validation Middleware:** Centralized Zod schemas (`RegisterSchema`, `LoginSchema`, `UserSettingsSchema`, `CreatePlaylistSchema`, `TelemetrySchema`, `SyncTrackSchema`).
- **Authorization:** Verification of `obsidian_token` via HTTP-only cookie and `Authorization: Bearer <token>` header.
- **Domain Services:**
  - `auth.service.ts`: User authentication, password hashing with bcrypt, JSON preference updates.
  - `catalog.service.ts`: Search aggregation, track synchronization, favorites management.
  - `playlist.service.ts`: Playlist creation, track mapping, position reordering.
  - `history.service.ts`: Telemetry interaction logging with weighted scoring.

### Tier 3: Persistence & Recommendation Engine
Located in `src/server/recommendation/`:
- **Taste Profile (`tasteProfile.ts`):** Calculates decayed acoustic persona centroid vectors across 8 dimensions:
  $$\text{decay} = e^{-0.05 \times \Delta t_{\text{days}}}$$
  $$\vec{V}_{\text{user}} = \frac{\sum w_i \cdot \vec{E}_i}{\sum w_i}$$
  Persisted directly into PostgreSQL `User.tasteVector`.
- **Ranking Engine (`ranking.ts`):**
  - **Made For You:** High cosine similarity against user acoustic centroid, filtered to exclude previously played tracks.
  - **Heavy Rotation:** Most frequently completed tracks with highest interaction weights.
  - **Discovery Station:** Multi-factor score combining cosine similarity and novelty exploration:
    $$\text{Score} = \text{Sim} \times (1 - \text{familiarity} \times 0.85)$$
- **Dynamic Radio (`radio.ts`):** Blends 40% vector acoustic discovery, 30% YouTube Mix (`RDAMVM`) neighbors, and 30% user favorites.

### Tier 4: Encapsulated YouTube Provider Adapter
Located in `src/server/providers/`:
- **Direct Stream Manifest Resolver:** Uses `@distube/ytdl-core` with 2500ms probe timeout and 45-minute in-memory caching. Prioritizes `audio/mp4` AAC on iOS Safari and `audio/webm` Opus or AAC on Android/Desktop.
- **RDAMVM YouTube Mix Scraper:** Extracts YouTube's native radio mix for any track ID directly from `ytInitialData.twoColumnWatchNextResults.playlist.playlist.contents`.
- **cleanNorm Deduplication:** Strips video noise (`(Official Video)`, `[Lyric Video]`, etc.) to match canonical titles.
- **±3s Duration-Guarded Importer Matcher:** Validates duration tolerances when matching imported playlists from Spotify or Apple Music.

---

## 5. Byte-Range Audio Proxy & CORS Architecture

Direct Google Video CDN URLs expire quickly, enforce strict origin checks, and fail on mobile browsers that require byte-range requests for audio seeking.

Obsidian routes native audio playback through its high-performance byte-range streaming proxy:

```mermaid
sequenceDiagram
    autonumber
    actor MobileBrowser as iOS Safari / Android Chrome
    participant Proxy as /api/stream/proxy (Obsidian)
    participant Adapter as YouTubeProviderAdapter
    participant GoogleCDN as Google Video Edge CDN

    MobileBrowser->>Proxy: GET /api/stream/proxy?id={youtubeId} (Range: bytes=0-)
    Proxy->>Adapter: getCachedRawStreamUrl(youtubeId)
    alt Cache Miss
        Adapter->>GoogleCDN: ytdl.getInfo(url) [2500ms timeout]
        GoogleCDN-->>Adapter: Formats Manifest (AAC / Opus direct URLs)
        Adapter-->>Proxy: Raw Stream URL (Cached 45m)
    end
    Proxy->>GoogleCDN: GET {rawStreamUrl} (Forwarding Range: bytes=0-)
    GoogleCDN-->>Proxy: 206 Partial Content (Accept-Ranges: bytes)
    Proxy-->>MobileBrowser: 206 Partial Content (CORS *, audio/mp4)
    Note over MobileBrowser: Native <audio> plays uninterrupted with screen off & DSP active!
```

---

## 6. How Obsidian Differs from Spotify

| Dimension | Spotify | Obsidian Hi-Fi |
| :--- | :--- | :--- |
| **Audio Sourcing** | Proprietary Ogg/AAC stream manifests | YouTube global edge manifests via `@distube/ytdl-core` |
| **Hosting & Bandwidth Cost** | Heavy server CDN audio egress | $0 egress via direct manifest proxying |
| **Web DSP Equalizer** | Limited / mobile-only basic EQ | **10-Band BiquadFilter EQ** directly in Web Audio API |
| **Volume Normalization** | Proprietary server-side loudness metadata | **Real-time -14 LUFS DynamicsCompressorNode** |
| **Mobile Screen-Off Playback** | Native app required for smooth lock screen | Native **HTML5 background audio + MediaSession API** in mobile web |
| **Import Ecosystem** | Locked ecosystem | Built-in **Spotify & Apple Music playlist importer** |
| **User Privacy** | Commercial tracking & ad profiles | Self-hosted, lightweight JWT session authorization |

---

## 7. API Route Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account with JSON preferences and 8D taste vector |
| `POST` | `/api/auth/login` | Authenticate with email/password and set HTTP-only JWT cookie |
| `GET` | `/api/auth/me` | Fetch active user session and profile |
| `POST` | `/api/auth/logout` | Revoke session cookie |
| `GET` | `/api/search` | Unified search across PostgreSQL catalog and YouTube provider |
| `GET` | `/api/stream` | Resolve audio stream manifest |
| `GET` | `/api/stream/proxy` | Byte-range audio proxy (`206 Partial Content`, `Accept-Ranges: bytes`) |
| `GET` | `/api/recommendations` | Fetch personalized rails (Made For You, Heavy Rotation, Discovery) |
| `GET` | `/api/tracks/similar` | Scrape RDAMVM related mix and vector neighbors |
| `POST` | `/api/tracks/sync` | Upsert track metadata into PostgreSQL |
| `GET, POST` | `/api/tracks/like` | Fetch and toggle user liked songs |
| `POST` | `/api/telemetry` | Ingest listening telemetry and update taste profile centroid |
| `GET, POST` | `/api/playlists` | List user/public playlists and create new playlist |
| `GET, PUT, DEL` | `/api/playlists/[id]` | Fetch, update, reorder tracks, or delete playlist |
| `POST, DEL` | `/api/playlists/[id]/tracks` | Add or remove track from playlist |
| `POST, GET` | `/api/import` | Ingest Spotify/Apple Music playlist URL for background matching |

---

## 8. Database Schema & Data Models

Obsidian uses **PostgreSQL** via **Prisma ORM** with native `Float[]` array embeddings and `Json` preferences:

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  username     String
  passwordHash String
  preferences  Json        @default("{\"bitrate\":\"high\",\"normalization\":true,\"crossfade\":2,\"eqEnabled\":true,\"eqPreset\":\"Flat\",\"eqBands\":[0,0,0,0,0,0,0,0,0,0]}")
  tasteVector  Float[]     @default([])
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
  duration    Int
  thumbnail   String
  embedding   Float[]         @default([]) // 8D native float vector
  audioUrl    String?
  lyrics      String?
  likes       UserLike[]
  playlistMap PlaylistTrack[]
  history     Telemetry[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([isrc])
}

model Telemetry {
  id              String   @id @default(cuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackId         String
  track           Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  event           String   // track_start, track_progress, track_skip, track_complete
  progressSeconds Float    @default(0)
  durationSeconds Float    @default(0)
  weight          Float    @default(0) // +0.05, +0.10, -0.80, +1.20
  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
}
```

---

## 9. Step-by-Step Instructions on How to Run

Follow these instructions to set up and run Obsidian locally on your computer.

### Prerequisites

Make sure the following tools are installed on your machine:
- **Node.js:** `v20.x` or higher (`node -v`)
- **npm:** `v9.x` or higher (`npm -v`)
- **Git:** (`git -v`)
- **Database Choice:**
  - **Docker** (recommended for zero-config PostgreSQL setup), OR
  - A local or hosted **PostgreSQL instance** (PostgreSQL 14+, Neon, Supabase, etc.)

---

### Step 1: Install Dependencies

Open a terminal in the project root directory and install dependencies:

```bash
npm install
```

---

### Step 2: Configure Environment Variables

Create your `.env` file in the root directory (or copy from `.env.example`):

```bash
# On Linux / macOS / Git Bash
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

Ensure your `.env` file contains:

```env
# PostgreSQL Database Connection String
DATABASE_URL="postgresql://postgres:password123@localhost:5432/obsidian?schema=public"

# JWT Secret for Session & Cookie Authentication
JWT_SECRET="obsidian-super-secret-jwt-key-2026-production"

# Application Port
PORT=3000

# Node Environment
NODE_ENV="development"
```

---

### Step 3: Provision PostgreSQL Database

#### Option A: 1-Click Docker Compose (Recommended)

If you have Docker Desktop installed, launch PostgreSQL in the background with a single command:

```bash
docker compose up -d
```

This starts a lightweight PostgreSQL 16 container pre-configured with:
- **Host:** `localhost:5432`
- **Username:** `postgres`
- **Password:** `password123`
- **Database:** `obsidian`

*(To stop the container later, run `docker compose down`)*.

#### Option B: Existing Local or Cloud PostgreSQL

If you already have a local PostgreSQL service running or are using a cloud database (such as **Neon**, **Supabase**, or **Railway**):
1. Create a database named `obsidian` (or any name you prefer).
2. Update the `DATABASE_URL` in your `.env` file with your connection string:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
   ```

---

### Step 4: Push Prisma Schema & Generate Client

Synchronize the database schema and compile the Prisma Client:

```bash
# Validate schema syntax
npx prisma validate

# Push schema directly to PostgreSQL (creates tables, indexes, and enum types)
npx prisma db push

# Generate the typed Prisma client
npx prisma generate
```

---

### Step 5: Seed Database with 8D Vectors & Catalog

Populate the database with default tracks, 8D audio feature embeddings (`[energy, valence, tempo, acousticness, danceability, instrumentalness, speechiness, liveness]`), curated playlists, and a demo user:

```bash
npx tsx src/lib/db/seed.ts
```

Output:
```
Seeding PostgreSQL database...
Database seeded successfully with 10 tracks and 2 playlists.
```

---

### Step 6: Start the Application

You can run Obsidian in either **Development Mode** or **Production Mode**:

#### Running in Development Mode
Best for development with instant hot-reloading:

```bash
npm run dev
```

The application will be live at:
👉 **`http://localhost:3000`**

#### Running in Production Mode
Best for maximum audio performance, pre-compiled bundles, and speed:

```bash
# 1. Compile the production build
npm run build

# 2. Start the production server
npm run start
```

The production server starts on `http://localhost:3000` with pre-rendered pages and dynamic API routes.

---

### Step 7: Testing Mobile Background Audio & Lock-Screen Controls

Obsidian is engineered to run seamlessly on smartphones with continuous playback when the screen is turned off or locked.

#### Local Wi-Fi Network Access
To open Obsidian on your smartphone:
1. Ensure your smartphone and your PC are connected to the **same Wi-Fi network**.
2. Find your PC's local IP address:
   - **Windows:** Run `ipconfig` in PowerShell (look for `IPv4 Address`, e.g. `192.168.1.45`).
   - **macOS / Linux:** Run `ifconfig` or `ip a` (e.g. `192.168.1.45`).
3. Start the Next.js server binding to all network interfaces:
   ```bash
   npx next dev -H 0.0.0.0
   # OR for production:
   npx next start -H 0.0.0.0
   ```
4. Open your phone's browser and navigate to:
   👉 **`http://192.168.1.X:3000`** (replace `192.168.1.X` with your PC's IP).

*(Alternatively, use a tunnel like `npx localtunnel --port 3000` or `ngrok http 3000` for an instant HTTPS URL).*

#### Testing on iOS Safari (iPhone / iPad)
1. Open the URL in **Safari**.
2. Tap any track to begin playback.
3. Lock your iPhone or press the side power button to turn off the screen.
4. **Result:** Music continues playing continuously without pausing.
5. Wake the screen (without unlocking): view the **native iOS Lock-Screen Music Player** complete with high-resolution artwork, track title, artist, play/pause, next/previous track, and scrubbing bar.

#### Testing on Android (Google Chrome)
1. Open the URL in **Chrome**.
2. Tap any track to begin playback.
3. Swipe down from the top of your screen or lock your phone.
4. **Result:** Music continues in the background, with full controls in the **Android Notification Center** and on the **Lock Screen**.

#### PWA Standalone Installation
- **iOS Safari:** Tap the **Share** button (`⎋`) → Select **"Add to Home Screen"**.
- **Android Chrome:** Tap the three dots (`⋮`) → Select **"Install App"** or **"Add to Home Screen"**.
- Obsidian launches full-screen as a standalone native app with no browser address bars!

---

## 10. Cloud Hosting & Production Deployment

For complete step-by-step guides, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

Obsidian is fully containerized and production-ready for global deployment:

### Recommended Hosting Options:
- **[Railway](https://railway.app) (Best for Audio Streaming):**
  - Continuous Node.js process supporting long-lived `/api/stream/proxy` byte-range audio connections without function timeouts.
  - 1-click managed PostgreSQL database.
  - Automatic deployment on every `git push` with free SSL domains.
- **[Render](https://render.com):**
  - Native Docker deployment using the included multi-stage `Dockerfile`.
  - Built-in PostgreSQL database and auto-deploy git hooks.
- **[Vercel](https://vercel.com) + [Neon](https://neon.tech) (Free Tier):**
  - Serverless Next.js deployment connected to a free Neon cloud PostgreSQL database.
- **Self-Hosted VPS (Hetzner / DigitalOcean / AWS):**
  - Complete control using `docker compose up -d` with persistent storage.

---

## 11. CI/CD Automation & Semantic Versioning

Obsidian includes pre-configured **GitHub Actions workflows** located in `.github/workflows/`:

1. **Continuous Integration ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):**
   - Automatically runs on every Pull Request and Push to `master`/`main`.
   - Runs `npm ci`, schema validation (`npx prisma validate`), client generation (`npx prisma generate`), strict TypeScript typechecking (`npx tsc --noEmit`), and full production build verification (`npm run build`).
2. **Release & Deployment ([`.github/workflows/release-and-deploy.yml`](.github/workflows/release-and-deploy.yml)):**
   - Triggers on every push to `master`.
   - **Automated Versioning:** Generates sequential semantic tags (`v1.0.X`) based on the build run.
   - **GitHub Release:** Publishes a formal GitHub Release with automated changelogs.
   - **Container Registry:** Builds and pushes multi-stage Docker images to **GitHub Container Registry (GHCR)**:
     `ghcr.io/<owner>/music-project:latest` and `:v1.0.X`.
   - **Auto-Deploy Webhook:** Pings your hosting provider (Railway, Render, or VPS) to deploy the new version with zero downtime.

---

## 12. Default Demo Credentials & Test Accounts

A default audiophile account is pre-seeded in the database:

| Field | Value |
| :--- | :--- |
| **Email** | `user@obsidian.audio` |
| **Password** | `password123` |
| **Role** | Audiophile (Pre-calibrated 8D taste profile) |

You can also register any new account on the fly using the **Sign Up** modal. User preferences and 10-band EQ settings will automatically persist to your account.

---

## 13. Troubleshooting & Frequently Asked Questions

### Q1: `Error: Could not find a production build in the '.next' directory`
- **Cause:** Running `npm run start` before compiling the app.
- **Fix:** Run `npm run build` first to generate the `.next` production distribution.

### Q2: `Port 3000 is already in use`
- **Fix (Option A):** Kill the process using port 3000:
  - Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process`
  - Linux/Mac: `npx kill-port 3000`
- **Fix (Option B):** Run on a different port:
  ```bash
  npm run dev -- -p 3001
  ```

### Q3: `PrismaClientInitializationError: Can't reach database server at localhost:5432`
- **Cause:** PostgreSQL is not running or the connection URL is incorrect.
- **Fix:** If using Docker, run `docker compose up -d` and check status with `docker ps`. Verify `DATABASE_URL` in `.env` matches your username, password, and port.

### Q4: Double-tap required to play songs?
- **Status:** **Resolved!** Direct streaming is routed through `/api/stream/proxy` with instant singleton player reuse. Songs play immediately upon a single tap.

### Q5: Music stops when iPhone locks?
- **Fix:** Ensure you are accessing via `/api/stream/proxy` (first-party audio stream). Make sure your iPhone is not in Low Power Mode with background app refresh completely disabled, and that you tapped Play at least once in Safari to grant audio thread permission.

---

<div align="center">
Built with precision for audiophiles. Powered by Web Audio API & Next.js.
</div>
