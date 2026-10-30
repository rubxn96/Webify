# Webify — High-Fidelity Ad-Free Music Streaming

An audiophile-grade web music streaming application that streams ad-free audio directly from YouTube, featuring a native client-side Web Audio DSP engine, dynamic vibe recommendations, Spotify playlist import, and an Apple Music-inspired Liquid Glass interface.

---

## Features

- **Ad-Free Audio Streaming**: Instant search and playback of any song or artist from YouTube with zero advertisements.
- **Web Audio DSP Engine**: Hardware-accelerated 10-band graphic equalizer (±12 dB gain), dynamic broadcast normalization (-14 LUFS), and 64-bin FFT spectrum visualizer.
- **Dynamic Vibe Discovery**: Homepage curated with live trending tracks in India, latest Bollywood & Hindi releases, South Wave (Tamil & Malayalam), Punjabi & Desi Hip-Hop, and Soulful Indie.
- **Session Listening History & Recommendations**: Automatically learns from your past 30 listened songs and curates a personalized queue matching your current vibe.
- **Queue Management**: Dynamic queue backfilling, reordering, and shuffle mode. Playlists play exclusively without outside track contamination.
- **Spotify & Apple Music Playlist Import**: Paste any public playlist URL to batch-match and import full tracklists into your library.
- **Theme & Appearance Settings**: Toggle between Dark Mode (obsidian frosted glass), Light Mode (clean daylight studio), and System Auto, with dynamic ambient album art glow.
- **Mobile Background Playback**: Continuous background audio on iOS Safari and Android Chrome with lock-screen MediaSession controls (album art, scrubbing, skip, play/pause).
- **User Accounts & Playlists**: Create, manage, and share personal playlists with private/public visibility toggles.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS with custom Liquid Glass frosted aesthetic |
| **Audio Core** | Web Audio API (BiquadFilterNode, DynamicsCompressorNode, AnalyserNode) |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | JWT in HTTP-only cookies with bcrypt password hashing |
| **Streaming** | `@distube/ytdl-core` audio manifest resolution & byte-range proxy |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) database (local or cloud like Render / Supabase / Neon)

### 1. Clone & Install

```bash
git clone https://github.com/rubxn96/Webify.git
cd Webify
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/webify_db?schema=public"

# JWT secret key for session authentication
JWT_SECRET="your-super-secret-jwt-key"

# Base application URL (optional in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database

Push the Prisma schema to your PostgreSQL database:

```bash
npx prisma db push
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment (Render / Vercel / Railway)

1. Connect your repository to your cloud hosting platform.
2. Set the build command to `npm run build` and start command to `npm run start`.
3. Configure the environment variables:
   - `DATABASE_URL`: Your PostgreSQL external connection string.
   - `JWT_SECRET`: A secure random string.
   - `NODE_ENV`: `production`.
4. Run `npx prisma db push` against your production database during first deployment.

---

## License

MIT License. Designed and built for high-fidelity music enthusiasts.
