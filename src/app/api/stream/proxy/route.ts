import { NextRequest, NextResponse } from 'next/server';
import { youtubeProvider } from '@/server/providers/youtube.adapter';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(req: NextRequest) {
  return handleProxyRequest(req, true);
}

export async function GET(req: NextRequest) {
  return handleProxyRequest(req, false);
}

async function handleProxyRequest(req: NextRequest, isHead: boolean) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    const tier = (searchParams.get('tier') as 'high' | 'normal' | 'low') || 'high';

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // 1. Get direct stream URL (from cache or resolve)
    let rawStreamUrl = youtubeProvider.getCachedRawStreamUrl(videoId);
    let mimeType = 'audio/mp4';

    if (!rawStreamUrl) {
      const resolved = await youtubeProvider.resolveStream(videoId, { tier });
      if (resolved.source === 'direct' && resolved.rawStreamUrl) {
        rawStreamUrl = resolved.rawStreamUrl;
        mimeType = resolved.mimeType;
      }
    }

    if (!rawStreamUrl) {
      return NextResponse.json(
        { error: 'Direct stream not available for this track', fallback: 'iframe' },
        { status: 404 }
      );
    }

    // 2. Prepare upstream headers (forwarding Range)
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        req.headers.get('user-agent') ||
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    };

    const incomingRange = req.headers.get('range');
    if (incomingRange) {
      upstreamHeaders['Range'] = incomingRange;
    }

    // 3. Fetch from upstream CDN
    let upstreamRes = await fetch(rawStreamUrl, {
      headers: upstreamHeaders,
      method: isHead ? 'HEAD' : 'GET',
    });

    // If 403 or URL expired, re-resolve once
    if (upstreamRes.status === 403 || upstreamRes.status === 410) {
      const fresh = await youtubeProvider.resolveStream(videoId, { tier });
      if (fresh.rawStreamUrl) {
        rawStreamUrl = fresh.rawStreamUrl;
        mimeType = fresh.mimeType;
        upstreamRes = await fetch(rawStreamUrl, {
          headers: upstreamHeaders,
          method: isHead ? 'HEAD' : 'GET',
        });
      }
    }

    // 4. Construct downstream response headers
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const upstreamContentType = upstreamRes.headers.get('content-type');
    responseHeaders.set('Content-Type', upstreamContentType || mimeType || 'audio/mp4');

    const upstreamContentLength = upstreamRes.headers.get('content-length');
    if (upstreamContentLength) {
      responseHeaders.set('Content-Length', upstreamContentLength);
    }

    const upstreamContentRange = upstreamRes.headers.get('content-range');
    if (upstreamContentRange) {
      responseHeaders.set('Content-Range', upstreamContentRange);
    }

    if (isHead) {
      return new NextResponse(null, {
        status: upstreamRes.status === 206 ? 206 : 200,
        headers: responseHeaders,
      });
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Audio proxy error:', err);
    return NextResponse.json({ error: 'Audio streaming proxy failure' }, { status: 502 });
  }
}

