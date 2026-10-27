import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { TelemetryPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body: TelemetryPayload = await req.json();

    const { trackId, event, progressSeconds, durationSeconds } = body;

    if (!trackId || !event) {
      return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
    }

    const cleanYtId = trackId.replace('yt-', '');

    // Verify track exists or find by youtubeId
    let dbTrack = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!dbTrack) {
      dbTrack = await prisma.track.findFirst({
        where: { youtubeId: cleanYtId },
      });
    }

    if (!dbTrack) {
      dbTrack = await prisma.track.create({
        data: {
          youtubeId: cleanYtId,
          title: 'YouTube Track',
          artist: 'YouTube Creator',
          duration: Math.round(durationSeconds) || 180,
          thumbnail: `https://img.youtube.com/vi/${cleanYtId}/hqdefault.jpg`,
          embedding: JSON.stringify([0.7, 0.6, 0.6, 0.2, 0.65, 0.05, 0.05, 0.2]),
        },
      });
    }

    let weight = 0;
    const ratio = durationSeconds > 0 ? progressSeconds / durationSeconds : 0;

    switch (event) {
      case 'track_start':
        weight = 0.05;
        break;
      case 'track_progress':
        weight = 0.1;
        break;
      case 'track_skip':
        weight = progressSeconds < 30 ? -1.0 : -0.2;
        break;
      case 'track_complete':
        weight = ratio >= 0.7 ? 2.0 : 0.5;
        break;
      default:
        weight = 0;
    }

    const entry = await prisma.telemetry.create({
      data: {
        userId: user ? user.id : null,
        trackId: dbTrack.id,
        event,
        progressSeconds,
        durationSeconds,
        weight,
      },
    });

    return NextResponse.json({ success: true, id: entry.id, weight });
  } catch (error) {
    console.error('Telemetry logging error:', error);
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}
