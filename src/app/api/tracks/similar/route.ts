import { NextRequest, NextResponse } from 'next/server';
import { getSimilarTracks } from '@/lib/youtube/similar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const youtubeId = searchParams.get('youtubeId');
    const title = searchParams.get('title') || '';
    const artist = searchParams.get('artist') || '';

    if (!youtubeId) {
      return NextResponse.json({ error: 'youtubeId is required' }, { status: 400 });
    }

    const tracks = await getSimilarTracks({
      youtubeId,
      title,
      artist,
    });

    return NextResponse.json({ tracks, count: tracks.length });
  } catch (error) {
    console.error('Similar tracks API error:', error);
    return NextResponse.json({ tracks: [] }, { status: 500 });
  }
}
