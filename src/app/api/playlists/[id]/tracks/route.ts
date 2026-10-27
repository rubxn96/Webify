import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playlistId } = params;
    const { trackId } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { tracks: true },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentCount = playlist.tracks.length;

    await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
      update: {},
      create: {
        playlistId,
        trackId,
        position: currentCount,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add track error:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
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

    const { id: playlistId } = params;
    const { trackId } = await req.json();

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist || playlist.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.playlistTrack.deleteMany({
      where: {
        playlistId,
        trackId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove track error:', error);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}

