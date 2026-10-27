import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const formatted = {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      coverImage: playlist.coverImage || (playlist.tracks[0]?.track.thumbnail ?? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'),
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

    return NextResponse.json({ playlist: formatted });
  } catch (error) {
    console.error('Playlist fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, description, isPublic, reorderedTrackIds } = await req.json();

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update metadata & visibility
    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description?.trim() : existing.description,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
      },
    });

    // Handle track reordering (drag-and-drop support)
    if (Array.isArray(reorderedTrackIds) && reorderedTrackIds.length > 0) {
      for (let i = 0; i < reorderedTrackIds.length; i++) {
        await prisma.playlistTrack.updateMany({
          where: { playlistId: id, trackId: reorderedTrackIds[i] },
          data: { position: i },
        });
      }
    }

    return NextResponse.json({ playlist: updated });
  } catch (error) {
    console.error('Playlist update error:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.playlist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Playlist deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}

