import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { youtubeId, title, artist, duration, thumbnail } = await req.json();

    if (!youtubeId || !title) {
      return NextResponse.json({ error: 'Missing required track fields' }, { status: 400 });
    }

    const track = await prisma.track.upsert({
      where: { youtubeId },
      update: {},
      create: {
        youtubeId,
        title: title || 'YouTube Song',
        artist: artist || 'Unknown Artist',
        duration: duration || 180,
        thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        embedding: JSON.stringify([0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2]),
      },
    });

    return NextResponse.json({ success: true, track });
  } catch (error) {
    console.error('Track sync error:', error);
    return NextResponse.json({ error: 'Failed to sync track' }, { status: 500 });
  }
}

