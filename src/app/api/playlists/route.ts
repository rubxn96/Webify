import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    const playlists = await prisma.playlist.findMany({
      where: user
        ? { OR: [{ userId: user.id }, { isPublic: true }] }
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

    const formatted = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      coverImage: p.coverImage || (p.tracks[0]?.track.thumbnail ?? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'),
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

    return NextResponse.json({ playlists: formatted });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isPublic, coverImage } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        userId: user.id,
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Playlist creation error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
