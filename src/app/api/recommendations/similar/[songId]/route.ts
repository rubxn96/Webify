import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hybridEngine } from '@/server/recommendation/hybridEngine';
import { getAuthenticatedUser } from '@/server/middleware/authorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { songId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const songId = params.songId;
    const limit = Math.min(30, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '15', 10)));

    if (!songId) {
      return NextResponse.json({ error: 'Missing songId' }, { status: 400 });
    }

    const ytId = songId.startsWith('yt-') ? songId.slice(3) : songId;

    const seed = await prisma.track.findFirst({
      where: {
        OR: [{ id: songId }, { youtubeId: ytId }, { youtubeId: songId }],
      },
    });

    if (!seed) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const similar = await hybridEngine.getHybridRecommendations({
      userId: user?.id,
      seedTrack: seed as any,
      limit,
      excludeHistory: false,
    });

    return NextResponse.json(
      { seed, tracks: similar, count: similar.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API similar/[songId]] error:', error);
    return NextResponse.json({ error: 'Failed to retrieve similar songs' }, { status: 500 });
  }
}

