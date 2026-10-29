import prisma from '@/lib/db/prisma';
import { Playlist, Track } from '@/types';

export class PlaylistService {
  public async getPlaylists(userId?: string): Promise<any[]> {
    const playlists = await prisma.playlist.findMany({
      where: userId
        ? { OR: [{ userId }, { isPublic: true }] }
        : { isPublic: true },
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
      authorName: p.user.username,
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
  }

  public async getPlaylistById(id: string): Promise<any | null> {
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

    if (!playlist) return null;

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
      authorName: playlist.user.username,
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

  public async addTrackToPlaylist(playlistId: string, trackData: any) {
    let track = await prisma.track.findFirst({
      where: {
        OR: [{ id: trackData.id }, { youtubeId: trackData.youtubeId }],
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

    const currentTracksCount = await prisma.playlistTrack.count({
      where: { playlistId },
    });

    return await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId: track.id,
        },
      },
      update: {},
      create: {
        playlistId,
        trackId: track.id,
        position: currentTracksCount,
      },
    });
  }

  public async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    return await prisma.playlistTrack.deleteMany({
      where: {
        playlistId,
        trackId,
      },
    });
  }
}

export const playlistService = new PlaylistService();

