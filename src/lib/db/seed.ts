import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_TRACKS } from './seedData';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('Seeding database...');

  // 1. Upsert Default User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@obsidian.audio' },
    update: {},
    create: {
      email: 'user@obsidian.audio',
      username: 'Audiophile',
      passwordHash,
      settings: JSON.stringify({
        bitrate: 'high',
        normalization: true,
        crossfade: 2,
        eqEnabled: true,
        eqPreset: 'Flat',
        eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    },
  });

  // 2. Upsert Seed Tracks
  const createdTracks = [];
  for (const st of SEED_TRACKS) {
    const track = await prisma.track.upsert({
      where: { youtubeId: st.youtubeId },
      update: {
        title: st.title,
        artist: st.artist,
        album: st.album,
        isrc: st.isrc,
        duration: st.duration,
        thumbnail: st.thumbnail,
        embedding: JSON.stringify(st.embedding),
        lyrics: st.lyrics,
      },
      create: {
        youtubeId: st.youtubeId,
        title: st.title,
        artist: st.artist,
        album: st.album,
        isrc: st.isrc,
        duration: st.duration,
        thumbnail: st.thumbnail,
        embedding: JSON.stringify(st.embedding),
        lyrics: st.lyrics,
      },
    });
    createdTracks.push(track);
  }

  // 3. Upsert Curated Playlists
  const playlist1 = await prisma.playlist.upsert({
    where: { id: 'obsidian-curated-1' },
    update: {},
    create: {
      id: 'obsidian-curated-1',
      name: 'Obsidian Essentials',
      description: 'Hand-picked anthems tuned for high-fidelity Web Audio playback.',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      isPublic: true,
      userId: defaultUser.id,
    },
  });

  // Attach tracks to playlist 1
  for (let i = 0; i < Math.min(6, createdTracks.length); i++) {
    await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId: playlist1.id,
          trackId: createdTracks[i].id,
        },
      },
      update: { position: i },
      create: {
        playlistId: playlist1.id,
        trackId: createdTracks[i].id,
        position: i,
      },
    });
  }

  const playlist2 = await prisma.playlist.upsert({
    where: { id: 'obsidian-curated-2' },
    update: {},
    create: {
      id: 'obsidian-curated-2',
      name: 'Electronic Midnight',
      description: 'Pumping basslines and spatial synths with dynamic audio normalization.',
      coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      isPublic: true,
      userId: defaultUser.id,
    },
  });

  for (let i = 4; i < Math.min(10, createdTracks.length); i++) {
    await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId: playlist2.id,
          trackId: createdTracks[i].id,
        },
      },
      update: { position: i - 4 },
      create: {
        playlistId: playlist2.id,
        trackId: createdTracks[i].id,
        position: i - 4,
      },
    });
  }

  // Initial user likes
  if (createdTracks.length > 2) {
    await prisma.userLike.upsert({
      where: {
        userId_trackId: {
          userId: defaultUser.id,
          trackId: createdTracks[0].id,
        },
      },
      update: {},
      create: {
        userId: defaultUser.id,
        trackId: createdTracks[0].id,
      },
    });

    await prisma.userLike.upsert({
      where: {
        userId_trackId: {
          userId: defaultUser.id,
          trackId: createdTracks[2].id,
        },
      },
      update: {},
      create: {
        userId: defaultUser.id,
        trackId: createdTracks[2].id,
      },
    });
  }

  console.log(`Database seeded successfully with ${createdTracks.length} tracks and 2 playlists.`);
}

if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

