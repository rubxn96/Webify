import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { playlistService } from '@/server/modules/playlists/playlist.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playlistId } = params;
    const body = await req.json();

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await playlistService.addTrackToPlaylist(playlistId, {
      id: body.trackId,
      youtubeId: body.youtubeId || body.trackId,
      title: body.title || 'Track',
      artist: body.artist || 'Unknown Artist',
      duration: body.duration || 180,
      thumbnail: body.thumbnail || '',
      album: body.album,
      lyrics: body.lyrics,
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
    const user = await getAuthenticatedUser(req);
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

    await playlistService.removeTrackFromPlaylist(playlistId, trackId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove track error:', error);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
