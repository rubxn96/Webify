import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    let userId = user?.id;

    // Fallback to first user in DB if unauthenticated in dev
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) userId = defaultUser.id;
    }

    if (!userId) {
      return NextResponse.json({ likedTrackIds: [], tracks: [] });
    }

    const likes = await prisma.userLike.findMany({
      where: { userId },
      include: {
        track: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tracks = likes.map((l) => ({
      id: l.track.id,
      youtubeId: l.track.youtubeId,
      title: l.track.title,
      artist: l.track.artist,
      album: l.track.album || undefined,
      duration: l.track.duration,
      thumbnail: l.track.thumbnail,
      source: 'catalog' as const,
    }));

    return NextResponse.json({
      likedTrackIds: likes.map((l) => l.trackId),
      tracks,
    });
  } catch (error) {
    console.error('Fetch likes error:', error);
    return NextResponse.json({ likedTrackIds: [], tracks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId, isLiked, trackData } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    // Find or create track if necessary
    let track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      const cleanYtId = trackId.replace('yt-', '');
      track = await prisma.track.findFirst({ where: { youtubeId: cleanYtId } });

      if (!track && trackData) {
        track = await prisma.track.create({
          data: {
            youtubeId: trackData.youtubeId || cleanYtId,
            title: trackData.title || 'YouTube Track',
            artist: trackData.artist || 'Unknown Artist',
            duration: trackData.duration || 180,
            thumbnail: trackData.thumbnail || `https://img.youtube.com/vi/${cleanYtId}/hqdefault.jpg`,
            embedding: JSON.stringify([0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2]),
          },
        });
      }
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
