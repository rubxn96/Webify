import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { catalogService } from '@/server/modules/catalog/catalog.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ likedTrackIds: [], tracks: [] });
    }

    const likedTrackIds = await catalogService.getLikedTrackIds(user.id);
    const tracks = await catalogService.getLikedTracks(user.id);

    return NextResponse.json({ likedTrackIds, tracks });
  } catch (error) {
    console.error('Fetch likes error:', error);
    return NextResponse.json({ likedTrackIds: [], tracks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId, isLiked, trackData } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    const result = await catalogService.toggleLike(user.id, trackId, !!isLiked, trackData);
    return NextResponse.json({ success: true, isLiked: result });
  } catch (error) {
    console.error('Like toggle error:', error);
    return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
  }
}
