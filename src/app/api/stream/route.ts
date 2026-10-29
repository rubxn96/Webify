import { NextRequest, NextResponse } from 'next/server';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const bitrate = (searchParams.get('bitrate') as 'auto' | 'normal' | 'high') || 'high';

    if (!videoId) {
      return NextResponse.json({ error: 'YouTube video ID is required' }, { status: 400 });
    }

    const streamResult = await youtubeProvider.resolveStream(videoId, {
      tier: bitrate === 'auto' ? 'high' : bitrate,
    });

    return NextResponse.json(streamResult, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Stream resolution error:', error);
    // Return embedded iframe fallback mode
    return NextResponse.json({
      audioUrl: null,
      mimeType: 'audio/youtube-iframe',
      bitrate: 160,
      source: 'iframe',
    });
  }
}
