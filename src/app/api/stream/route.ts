import { NextRequest, NextResponse } from 'next/server';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const bitrate = (searchParams.get('bitrate') as 'auto' | 'normal' | 'high') || 'high';
    const userAgent = req.headers.get('user-agent') || '';
    const isApple =
      /iPad|iPhone|iPod/i.test(userAgent) ||
      (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edg/i.test(userAgent));
    const formatParam = searchParams.get('format') as 'mp4' | 'webm' | 'any' | null;
    const preferredFormat = formatParam || (isApple ? 'mp4' : 'any');

    if (!videoId) {
      return NextResponse.json({ error: 'YouTube video ID is required' }, { status: 400 });
    }

    const streamResult = await youtubeProvider.resolveStream(videoId, {
      tier: bitrate === 'auto' ? 'high' : bitrate,
      preferredFormat,
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
