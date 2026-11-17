import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { trackingService } from '@/server/modules/tracking/tracking.service';

export const dynamic = 'force-dynamic';

const ListeningEventSchema = z.object({
  trackId: z.string().min(1),
  youtubeId: z.string().optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  thumbnail: z.string().optional(),
  eventType: z.enum([
    'track_start',
    'track_progress',
    'track_80_percent',
    'track_complete',
    'track_like',
    'track_dislike',
    'playlist_add',
    'playlist_remove',
    'track_repeat',
    'track_skip',
    'artist_follow',
    'search_query',
  ]),
  progressSeconds: z.number().default(0),
  durationSeconds: z.number().default(180),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const parsed = ListeningEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid listening event payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const sessionId =
      parsed.data.sessionId ||
      req.cookies.get('webify_session_id')?.value ||
      req.headers.get('x-session-id') ||
      undefined;

    const result = await trackingService.recordEvent({
      userId: user?.id,
      sessionId,
      trackId: parsed.data.trackId,
      youtubeId: parsed.data.youtubeId,
      title: parsed.data.title,
      artist: parsed.data.artist,
      thumbnail: parsed.data.thumbnail,
      eventType: parsed.data.eventType,
      progressSeconds: parsed.data.progressSeconds,
      durationSeconds: parsed.data.durationSeconds,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ success: true, eventId: result?.id });
  } catch (error) {
    console.error('[API listening-events] error:', error);
    return NextResponse.json({ error: 'Failed to record listening event' }, { status: 500 });
  }
}

