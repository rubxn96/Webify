import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { CreatePlaylistSchema } from '@/server/middleware/validation';
import { playlistService } from '@/server/modules/playlists/playlist.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const playlists = await playlistService.getPlaylists(user?.id);
    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreatePlaylistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid playlist data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const playlist = await playlistService.createPlaylist(user.id, parsed.data);
    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Playlist creation error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
