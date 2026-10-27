import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { TelemetryPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body: TelemetryPayload = await req.json();

    const { trackId, event, progressSeconds, durationSeconds } = body;

    if (!trackId || !event) {
      return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
    }

    // Verify track exists or find by youtubeId
    let dbTrack = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!dbTrack) {
      dbTrack = await prisma.track.findFirst({
        where: { youtubeId: trackId },
      });
    }

    if (!dbTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Calculate weight based on specification:
    // - track_skip: negative weight if skipped before 30s
    // - track_complete: positive weight if completion ratio > 70%
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
