import prisma from '@/lib/db/prisma';
import { Playlist, Track } from '@/types';
import { SEED_TRACKS } from '@/lib/db/seedData';

export class PlaylistService {
  public async getPlaylists(userId?: string): Promise<any[]> {
    if (!userId) {
      return [];
    }

    try {
      const playlists = await prisma.playlist.findMany({
        where: { userId },
        include: {
          tracks: {
            include: { track: true },
            orderBy: { position: 'asc' },
          },
          user: {
            select: { username: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return playlists.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        coverImage:
          p.coverImage ||
          p.tracks[0]?.track.thumbnail ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        isPublic: p.isPublic,
        userId: p.userId,
        authorName: p.user?.username || 'You',
        trackCount: p.tracks.length,
        tracks: p.tracks.map((pt) => ({
          id: pt.track.id,
          youtubeId: pt.track.youtubeId,
          title: pt.track.title,
          artist: pt.track.artist,
          album: pt.track.album,
          isrc: pt.track.isrc,
          duration: pt.track.duration,
          thumbnail: pt.track.thumbnail,
        })),
      }));
    } catch (err) {
      console.warn('[PlaylistService] Database error fetching user playlists:', err);
      return [];
    }
  }

  public async getPlaylistById(id: string): Promise<any | null> {
    try {
      const playlist = await prisma.playlist.findUnique({
        where: { id },
        include: {
          tracks: {
            include: { track: true },
            orderBy: { position: 'asc' },
          },
          user: { select: { username: true } },
        },
      });

      if (playlist) {
        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          coverImage:
            playlist.coverImage ||
            playlist.tracks[0]?.track.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
          isPublic: playlist.isPublic,
          userId: playlist.userId,
          authorName: playlist.user?.username || 'Webify Editorial',
          trackCount: playlist.tracks.length,
          tracks: playlist.tracks.map((pt) => ({
            id: pt.track.id,
            youtubeId: pt.track.youtubeId,
            title: pt.track.title,
            artist: pt.track.artist,
            album: pt.track.album,
            isrc: pt.track.isrc,
            duration: pt.track.duration,
            thumbnail: pt.track.thumbnail,
            lyrics: pt.track.lyrics,
            position: pt.position,
          })),
        };
      }
    } catch {
      // offline fallback
    }

    if (id === 'webify-curated-1') {
      const tracks = SEED_TRACKS.slice(0, 10).map((st, idx) => ({ id: `seed-${idx}`, ...st }));
      return {
        id,
        name: 'Webify Desi Chartbusters',
        description: 'The biggest Bollywood & indie anthems: Kesariya, Tauba Tauba, Chaleya & more.',
        coverImage: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg',
        isPublic: true,
        authorName: 'Webify Editorial',
        trackCount: tracks.length,
        tracks,
      };
    }
    if (id === 'webify-curated-2') {
      const tracks = SEED_TRACKS.slice(14, 28).map((st, idx) => ({ id: `seed-${idx + 14}`, ...st }));
      return {
        id,
        name: 'South Pulse (Tamil & Malayalam)',
        description: 'High-voltage energy from Anirudh, Sushin Shyam, Dabzee & Sai Abhyankkar.',
        coverImage: 'https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg',
        isPublic: true,
        authorName: 'Webify Editorial',
        trackCount: tracks.length,
        tracks,
      };
    }
    if (id === 'webify-curated-3') {
      const tracks = SEED_TRACKS.filter((st) =>
        ['Husn', 'Aaraadhike', 'Vaseegara', 'Malare', 'Agar Tum Saath Ho', 'Darshana', 'Pehle Bhi Main'].includes(st.title)
      ).map((st, idx) => ({ id: `seed-ac-${idx}`, ...st }));
      return {
        id,
        name: 'Soulful Melodies & Acoustics',
        description: 'Mellow romantic ballads and unplugged harmonies across Hindi, Tamil & Malayalam.',
        coverImage: 'https://i.ytimg.com/vi/gJLVTKhTnog/hqdefault.jpg',
        isPublic: true,
        authorName: 'Webify Editorial',
        trackCount: tracks.length,
        tracks,
      };
    }

    return null;
  }

  public async createPlaylist(
    userId: string,
    data: { name: string; description?: string; coverImage?: string; isPublic?: boolean }
  ) {
    return await prisma.playlist.create({
      data: {
        name: data.name,
        description: data.description,
        coverImage: data.coverImage,
        isPublic: data.isPublic ?? true,
        userId,
      },
    });
  }

  public async addTrackToPlaylist(
    playlistId: string,
    trackData:
      | {
          id?: string;
          youtubeId: string;
          title: string;
          artist: string;
          duration?: number;
          thumbnail?: string;
          album?: string;
          lyrics?: string;
        }
      | string,
    userId?: string
  ) {
    if (userId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
      });
      if (!playlist || playlist.userId !== userId) {
        throw new Error('Unauthorized or playlist not found');
      }
    }

    let targetTrackId = typeof trackData === 'string' ? trackData : trackData.id;

    if (typeof trackData !== 'string') {
      try {
        let track = await prisma.track.findFirst({
          where: {
            OR: [
              ...(targetTrackId ? [{ id: targetTrackId }] : []),
              { youtubeId: trackData.youtubeId },
            ],
          },
        });

        if (!track) {
          track = await prisma.track.create({
            data: {
              youtubeId: trackData.youtubeId,
              title: trackData.title,
              artist: trackData.artist,
              duration: trackData.duration || 180,
              thumbnail: trackData.thumbnail || '',
              album: trackData.album,
              lyrics: trackData.lyrics,
              embedding: [0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2],
            },
          });
        }
        targetTrackId = track.id;
      } catch {
        // fallback if DB write fails
      }
    }

    if (!targetTrackId) {
      throw new Error('Track ID required');
    }

    try {
      const count = await prisma.playlistTrack.count({
        where: { playlistId },
      });

      return await prisma.playlistTrack.create({
        data: {
          playlistId,
          trackId: targetTrackId,
          position: count,
        },
      });
    } catch {
      return { success: true };
    }
  }

  public async removeTrackFromPlaylist(playlistId: string, trackId: string, userId?: string) {
    if (userId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
      });
      if (!playlist || playlist.userId !== userId) {
        throw new Error('Unauthorized or playlist not found');
      }
    }

    try {
      return await prisma.playlistTrack.delete({
        where: {
          playlistId_trackId: {
            playlistId,
            trackId,
          },
        },
      });
    } catch {
      return { success: true };
    }
  }
}

export const playlistService = new PlaylistService();
