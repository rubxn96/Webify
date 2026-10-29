import prisma from './prisma';
import { seedDatabase } from './seed';

export async function ensureDatabaseTables(): Promise<{ created: boolean; seeded: boolean; message: string }> {
  try {
    // 1. Check if the "User" table exists in the public schema
    const checkTable: any = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      ) as "exists";
    `);

    const tableExists = checkTable && checkTable[0] && (checkTable[0].exists === true || checkTable[0].exists === 't');

    if (tableExists) {
      // Ensure Telemetry table has sessionId column
      await prisma.$executeRawUnsafe(`ALTER TABLE "Telemetry" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;`).catch(() => {});
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Telemetry_sessionId_createdAt_idx" ON "Telemetry"("sessionId", "createdAt");`).catch(() => {});

      // Check if tracks are populated
      const trackCount = await prisma.track.count().catch(() => 0);
      if (trackCount === 0) {
        await seedDatabase();
        return { created: false, seeded: true, message: 'Database tables existed. Seeded catalog with 38 Indian hits.' };
      }
      return { created: false, seeded: false, message: 'Database already fully initialized and populated.' };
    }

    console.log('[AutoInit] PostgreSQL tables not found. Initializing schema automatically...');

    // 2. Execute DDL statements
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "preferences" JSONB NOT NULL DEFAULT '{"bitrate":"high","normalization":true,"crossfade":2,"eqEnabled":true,"eqPreset":"Flat","eqBands":[0,0,0,0,0,0,0,0,0,0]}',
        "tasteVector" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Track" (
        "id" TEXT NOT NULL,
        "youtubeId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "artist" TEXT NOT NULL,
        "album" TEXT,
        "isrc" TEXT,
        "duration" INTEGER NOT NULL,
        "thumbnail" TEXT NOT NULL,
        "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
        "audioUrl" TEXT,
        "lyrics" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Playlist" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "coverImage" TEXT,
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "PlaylistTrack" (
        "id" TEXT NOT NULL,
        "playlistId" TEXT NOT NULL,
        "trackId" TEXT NOT NULL,
        "position" INTEGER NOT NULL DEFAULT 0,
        "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "UserLike" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "trackId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserLike_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Telemetry" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "sessionId" TEXT,
        "trackId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "progressSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "durationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "ImportJob" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "source" TEXT NOT NULL,
        "sourceUrl" TEXT NOT NULL,
        "playlistTitle" TEXT,
        "totalTracks" INTEGER NOT NULL DEFAULT 0,
        "matchedTracks" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "unresolvedTracks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      CREATE UNIQUE INDEX IF NOT EXISTS "Track_youtubeId_key" ON "Track"("youtubeId");
      CREATE INDEX IF NOT EXISTS "Track_isrc_idx" ON "Track"("isrc");
      CREATE UNIQUE INDEX IF NOT EXISTS "PlaylistTrack_playlistId_trackId_key" ON "PlaylistTrack"("playlistId", "trackId");
      CREATE UNIQUE INDEX IF NOT EXISTS "UserLike_userId_trackId_key" ON "UserLike"("userId", "trackId");
      CREATE INDEX IF NOT EXISTS "Telemetry_userId_createdAt_idx" ON "Telemetry"("userId", "createdAt");
      CREATE INDEX IF NOT EXISTS "Telemetry_sessionId_createdAt_idx" ON "Telemetry"("sessionId", "createdAt");

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Playlist_userId_fkey') THEN
          ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlaylistTrack_playlistId_fkey') THEN
          ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlaylistTrack_trackId_fkey') THEN
          ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserLike_userId_fkey') THEN
          ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserLike_trackId_fkey') THEN
          ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Telemetry_userId_fkey') THEN
          ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Telemetry_trackId_fkey') THEN
          ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('[AutoInit] PostgreSQL schema tables created. Seeding catalog...');
    await seedDatabase();

    return { created: true, seeded: true, message: 'Database schema successfully created and seeded with 38 Indian hits!' };
  } catch (err: any) {
    console.error('[AutoInit] Database initialization error:', err);
    throw new Error(`Database auto-init failed: ${err.message}`);
  }
}

