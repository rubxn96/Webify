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
    const body = await req.json();
    const trackId = body.trackId;

    if (!trackId && !body.youtubeId) {
      return NextResponse.json({ error: 'Track ID or youtubeId is required' }, { status: 400 });
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

    // Resolve or upsert track
    let targetTrack = await prisma.track.findFirst({
      where: {
        OR: [
          { id: trackId || '' },
          { youtubeId: trackId || body.youtubeId || '' },
        ],
      },
    });

    if (!targetTrack && (body.youtubeId || trackId)) {
      const yId = body.youtubeId || trackId;
      targetTrack = await prisma.track.create({
        data: {
          youtubeId: yId,
          title: body.title || 'YouTube Song',
          artist: body.artist || 'Unknown Artist',
          duration: body.duration || 180,
          thumbnail: body.thumbnail || `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
          embedding: JSON.stringify([0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2]),
        },
      });
    }

    if (!targetTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const currentCount = playlist.tracks.length;

    await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId: targetTrack.id,
        },
      },
      update: {},
      create: {
        playlistId,
        trackId: targetTrack.id,
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

