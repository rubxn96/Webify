# Obsidian — Cloud Hosting & CI/CD Deployment Guide

This guide provides end-to-end instructions for hosting **Obsidian** publicly so it can be accessed by users worldwide on desktop and mobile devices, along with setting up an automated **CI/CD pipeline** for zero-downtime updates and semantic version tracking.

---

## Table of Contents
1. [Recommended Hosting Platforms](#1-recommended-hosting-platforms)
2. [Method A: Railway (Recommended — Best for Streaming Audio)](#2-method-a-railway-recommended--best-for-streaming-audio)
3. [Method B: Render (PaaS with Native PostgreSQL)](#3-method-b-render-paas-with-native-postgresql)
4. [Method C: Vercel + Neon (Serverless Free Tier)](#4-method-c-vercel--neon-serverless-free-tier)
5. [Method D: Self-Hosted Docker on VPS (DigitalOcean / Hetzner / AWS)](#5-method-d-self-hosted-docker-on-vps)
6. [CI/CD Pipeline & Automated Versioning](#6-cicd-pipeline--automated-versioning)
   - [Continuous Integration (CI Workflow)](#continuous-integration-ci-workflow)
   - [Continuous Deployment & Version Releases](#continuous-deployment--version-releases)
   - [Configuring Repository Secrets](#configuring-repository-secrets)
7. [Post-Deployment Database Migration & Seeding](#7-post-deployment-database-migration--seeding)

---

## 1. Recommended Hosting Platforms

Obsidian includes a native byte-range audio proxy (`/api/stream/proxy`) and an encapsulated `@distube/ytdl-core` manifest extractor. For continuous mobile background playback and un-throttled audio streaming, container-based PaaS hosts with persistent Node.js processes perform best:

| Provider | Runtime Type | Audio Streaming Reliability | Database Option | Free / Hobby Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Railway** *(Recommended)* | Container (Docker / Nixpacks) | ⭐⭐⭐⭐⭐ Flawless (No function timeouts) | 1-Click PostgreSQL | $5 trial credit / low cost |
| **Render** | Container / Web Service | ⭐⭐⭐⭐⭐ Flawless (Persistent Node.js) | Native PostgreSQL | Free tier available |
| **Vercel + Neon** | Serverless Lambdas | ⭐⭐⭐⭐ Great (15-60s timeout limits) | Serverless PostgreSQL (Neon) | Generous Free tier |
| **Self-Hosted VPS** | Multi-Stage Docker | ⭐⭐⭐⭐⭐ Complete control | Self-hosted or Managed Postgres | $4 - $6 / month |

---

## 2. Method A: Railway (Recommended — Best for Streaming Audio)

[Railway](https://railway.app) runs persistent Node.js processes and handles long-lived HTTP range requests without terminating connections early.

### Step 1: Push your project to GitHub
If your project is not yet on GitHub:
```bash
git init
git add .
git commit -m "feat: complete obsidian 4-tier modular monolith"
git branch -M master
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin master
```

### Step 2: Deploy to Railway
1. Go to **[railway.app](https://railway.app)** and log in with your GitHub account.
2. Click **"+ New Project"** → Select **"Deploy from GitHub repo"**.
3. Choose your `music-project` repository.
4. Click **"Add a Service"** → Select **"Database"** → **"PostgreSQL"**.
5. Click on your web service card → Navigate to **Variables**:
   - Add `DATABASE_URL`: Click **"Add Reference"** and select `POSTGRES_URL` from the PostgreSQL service.
   - Add `JWT_SECRET`: Generate a random string (e.g. `obsidian-prod-secret-2026-secure-key`).
   - Add `PORT`: `3000`
   - Add `NODE_ENV`: `production`
6. Click **Settings** → Under **Networking**, click **"Generate Domain"** (e.g. `obsidian-production.up.railway.app`).
7. Railway automatically builds using the included multi-stage `Dockerfile` and deploys your application with automated HTTPS.

---

## 3. Method B: Render (PaaS with Native PostgreSQL)

[Render](https://render.com) provides free-tier web services and managed PostgreSQL databases.

### Step 1: Create PostgreSQL Database on Render
1. Log in to [render.com](https://render.com).
2. Click **"New +"** → **"PostgreSQL"**.
3. Name: `obsidian-db`, Region: choose closest to your users.
4. Click **"Create Database"** and copy the **Internal Database URL** (or External URL if connecting remotely).

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**.
2. Select your GitHub repository.
3. Configuration:
   - **Environment:** `Docker` (Render automatically uses our `Dockerfile`)
   - **Plan:** Free or Starter
4. Under **Environment Variables**:
   - `DATABASE_URL`: *(Paste Render PostgreSQL URL)*
   - `JWT_SECRET`: `your-random-jwt-secret-string`
   - `NODE_ENV`: `production`
5. Click **"Create Web Service"**.

---

## 4. Method C: Vercel + Neon (Serverless Free Tier)

If you prefer a 100% free serverless setup:

### Step 1: Create a Free PostgreSQL Database on Neon
1. Go to **[neon.tech](https://neon.tech)** and create a free account.
2. Create a project named `obsidian`.
3. Copy your Postgres connection string (looks like: `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).

### Step 2: Deploy to Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** → **"Project"** → Import your `music-project` repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: *(Paste your Neon connection string)*
   - `JWT_SECRET`: `obsidian-secret-key-2026-production`
4. Click **"Deploy"**. Vercel will build and assign you a `*.vercel.app` domain.

---

## 5. Method D: Self-Hosted Docker on VPS

For full ownership on any Linux VPS ($4/mo on Hetzner, DigitalOcean, or Linode):

### Step 1: SSH into your server
```bash
ssh root@your-server-ip
```

### Step 2: Clone repository & configure `.env`
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git /opt/obsidian
cd /opt/obsidian
cp .env.example .env
nano .env # update your DATABASE_URL and JWT_SECRET
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```
Your app is now live at `http://your-server-ip:3000`. Set up Nginx or Caddy with Let's Encrypt for automatic HTTPS.

---

## 6. CI/CD Pipeline & Automated Versioning

Obsidian comes pre-configured with two GitHub Actions workflows in `.github/workflows/`:

### 1. Continuous Integration (`ci.yml`)
Runs automatically on every **Pull Request** and **Push** to `master`/`main`:
- Checks out code and installs dependencies using `npm ci`.
- Validates the Prisma database schema (`npx prisma validate`).
- Generates the typed Prisma client (`npx prisma generate`).
- Runs full TypeScript typechecking (`npx tsc --noEmit`).
- Compiles the production Next.js build (`npm run build`).
- **Benefit:** Catches type errors, broken routes, or syntax regressions before they ever hit production.

### 2. Release & Deployment (`release-and-deploy.yml`)
Runs automatically when commits are merged into `master`/`main`:
1. **Automated Semantic Versioning:** Generates tags sequentially (`v1.0.1`, `v1.0.2`, etc.) based on GitHub Actions run numbers.
2. **GitHub Release:** Publishes a formal GitHub Release with automated changelogs.
3. **Container Registry:** Builds the optimized multi-stage Docker image and pushes it to **GitHub Container Registry (GHCR)**:
   - `ghcr.io/<your-username>/music-project:latest`
   - `ghcr.io/<your-username>/music-project:v1.0.X`
4. **Deploy Webhook:** If you set a `DEPLOY_WEBHOOK_URL` secret, GitHub Actions sends a webhook ping to Railway / Render / your VPS to instantly deploy the new version!

### Configuring Repository Secrets
In your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **"New repository secret"**:
   - `DEPLOY_WEBHOOK_URL` *(Optional)*: Your Railway or Render deploy hook URL (found in Service Settings → Deploy Hooks).

---

## 7. Post-Deployment Database Migration & Seeding

Once your hosted database is connected, push the database schema and seed the initial catalog:

### From your local machine (remotely pointing to production DB):
```bash
# Temporarily set DATABASE_URL in your local terminal:
$env:DATABASE_URL="postgresql://user:pass@hosted-db-url:5432/obsidian?sslmode=require"

# Push schema:
npx prisma db push

# Seed curated 8D vector catalog:
npx tsx src/lib/db/seed.ts
```

### Or through Railway / Render web shell:
Run the one-time commands:
```bash
npx prisma db push
npx tsx src/lib/db/seed.ts
```

Your Obsidian instance is now globally accessible, fully automated, and continuously deployed!

