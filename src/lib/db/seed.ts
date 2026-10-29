import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_TRACKS } from './seedData';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('Seeding PostgreSQL database with Indian Hits (Hindi, Tamil, Malayalam)...');

  // 1. Upsert Default User with Json preferences and 8D tasteVector
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@webify.audio' },
    update: {},
    create: {
      email: 'user@webify.audio',
      username: 'Audiophile',
      passwordHash,
      preferences: {
        bitrate: 'high',
        normalization: true,
        crossfade: 2,
        eqEnabled: true,
        eqPreset: 'Flat',
        eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      tasteVector: [0.75, 0.70, 0.65, 0.25, 0.72, 0.02, 0.08, 0.16],
    },
  });

  // 2. Remove legacy English tracks not present in the new SEED_TRACKS
  const newYoutubeIds = SEED_TRACKS.map((t) => t.youtubeId);
  const obsoleteTracks = await prisma.track.findMany({
    where: {
      youtubeId: {
        notIn: newYoutubeIds,
      },
    },
    select: { id: true, title: true },
  });

  if (obsoleteTracks.length > 0) {
    const obsoleteIds = obsoleteTracks.map((t) => t.id);
    console.log(`Cleaning up ${obsoleteTracks.length} old/English tracks from catalog...`);
    await prisma.playlistTrack.deleteMany({ where: { trackId: { in: obsoleteIds } } });
    await prisma.userLike.deleteMany({ where: { trackId: { in: obsoleteIds } } });
    await prisma.telemetry.deleteMany({ where: { trackId: { in: obsoleteIds } } });
    await prisma.track.deleteMany({ where: { id: { in: obsoleteIds } } });
  }

  // 3. Upsert New Seed Tracks with native Float[] 8D embedding
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
        embedding: st.embedding,
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
        embedding: st.embedding,
        lyrics: st.lyrics,
      },
    });
    createdTracks.push(track);
  }

  // 4. Curated Playlists
  // Playlist 1: Webify Desi Chartbusters (Hindi)
  const playlist1 = await prisma.playlist.upsert({
    where: { id: 'webify-curated-1' },
    update: {
      name: 'Webify Desi Chartbusters',
      description: 'The biggest Bollywood & indie anthems: Kesariya, Tauba Tauba, Chaleya & more.',
      coverImage: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg',
    },
    create: {
      id: 'webify-curated-1',
      name: 'Webify Desi Chartbusters',
      description: 'The biggest Bollywood & indie anthems: Kesariya, Tauba Tauba, Chaleya & more.',
      coverImage: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg',
      isPublic: true,
      userId: defaultUser.id,
    },
  });

  // Attach first 8 Hindi tracks to playlist 1
  await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist1.id } });
  const hindiTracks = createdTracks.slice(0, 10);
  for (let i = 0; i < hindiTracks.length; i++) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: playlist1.id,
        trackId: hindiTracks[i].id,
        position: i,
      },
    });
  }

  // Playlist 2: South Pulse (Tamil & Malayalam Hits)
  const playlist2 = await prisma.playlist.upsert({
    where: { id: 'webify-curated-2' },
    update: {
      name: 'South Pulse (Tamil & Malayalam)',
      description: 'High-voltage energy from Anirudh, Sushin Shyam, Dabzee & Sai Abhyankkar.',
      coverImage: 'https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg',
    },
    create: {
      id: 'webify-curated-2',
      name: 'South Pulse (Tamil & Malayalam)',
      description: 'High-voltage energy from Anirudh, Sushin Shyam, Dabzee & Sai Abhyankkar.',
      coverImage: 'https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg',
      isPublic: true,
      userId: defaultUser.id,
    },
  });

  // Attach South Indian tracks (indices 14 to 30) to playlist 2
  await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist2.id } });
  const southTracks = createdTracks.slice(14, 28);
  for (let i = 0; i < southTracks.length; i++) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: playlist2.id,
        trackId: southTracks[i].id,
        position: i,
      },
    });
  }

  // Playlist 3: Soulful Melodies
  const playlist3 = await prisma.playlist.upsert({
    where: { id: 'webify-curated-3' },
    update: {
      name: 'Soulful Melodies & Acoustics',
      description: 'Mellow romantic ballads and unplugged harmonies across Hindi, Tamil & Malayalam.',
      coverImage: 'https://i.ytimg.com/vi/gJLVTKhTnog/hqdefault.jpg',
    },
    create: {
      id: 'webify-curated-3',
      name: 'Soulful Melodies & Acoustics',
      description: 'Mellow romantic ballads and unplugged harmonies across Hindi, Tamil & Malayalam.',
      coverImage: 'https://i.ytimg.com/vi/gJLVTKhTnog/hqdefault.jpg',
      isPublic: true,
      userId: defaultUser.id,
    },
  });

  const acousticTracks = createdTracks.filter((t) =>
    ['Husn', 'Aaraadhike', 'Vaseegara', 'Malare', 'Agar Tum Saath Ho', 'Darshana', 'Pehle Bhi Main'].includes(t.title)
  );
  await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist3.id } });
  for (let i = 0; i < acousticTracks.length; i++) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: playlist3.id,
        trackId: acousticTracks[i].id,
        position: i,
      },
    });
  }

  // Initial user likes
  if (createdTracks.length > 2) {
    const kesariya = createdTracks.find((t) => t.title === 'Kesariya');
    const illuminati = createdTracks.find((t) => t.title === 'Illuminati');
    const hukum = createdTracks.find((t) => t.title.includes('Hukum'));

    for (const t of [kesariya, illuminati, hukum]) {
      if (t) {
        await prisma.userLike.upsert({
          where: {
            userId_trackId: {
              userId: defaultUser.id,
              trackId: t.id,
            },
          },
          update: {},
          create: {
            userId: defaultUser.id,
            trackId: t.id,
          },
        });
      }
    }
  }

  console.log(`Database seeded successfully with ${createdTracks.length} tracks and 3 curated playlists.`);
}

if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
