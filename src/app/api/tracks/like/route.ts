import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ likedTrackIds: [] });
    }

    const likes = await prisma.userLike.findMany({
      where: { userId: user.id },
      select: { trackId: true },
    });

    return NextResponse.json({
      likedTrackIds: likes.map((l) => l.trackId),
    });
  } catch (error) {
    console.error('Fetch likes error:', error);
    return NextResponse.json({ likedTrackIds: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId, isLiked } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    // Find or create track if necessary
    let track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      track = await prisma.track.findFirst({ where: { youtubeId: trackId } });
    }

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (isLiked) {
      await prisma.userLike.upsert({
        where: {
          userId_trackId: {
            userId: user.id,
            trackId: track.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          trackId: track.id,
        },
      });
    } else {
      await prisma.userLike.deleteMany({
        where: {
          userId: user.id,
          trackId: track.id,
        },
      });
    }

    return NextResponse.json({ success: true, trackId: track.id, isLiked });
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json({ error: 'Failed to update like state' }, { status: 500 });
  }
}
