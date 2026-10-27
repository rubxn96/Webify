import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { generateDiscoveryRails } from '@/lib/recommender/vectorEngine';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // Fetch all catalog tracks
    const dbTracks = await prisma.track.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const catalog: Track[] = dbTracks.map((t) => ({
      id: t.id,
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      album: t.album || undefined,
      isrc: t.isrc || undefined,
      duration: t.duration,
      thumbnail: t.thumbnail,
      embedding: t.embedding ? JSON.parse(t.embedding) : undefined,
      lyrics: t.lyrics || undefined,
    }));

    // Fetch user telemetry interactions
    let interactions: Array<{ trackId: string; weight: number }> = [];
    if (user) {
      const dbTelemetry = await prisma.telemetry.findMany({
        where: { userId: user.id },
        select: { trackId: true, weight: true },
        take: 100,
      });
      interactions = dbTelemetry;
    }

    const { heavyRotation, discoveryMix, artistSpotlight } = generateDiscoveryRails(
      catalog,
      interactions
    );

    // Quick Access Grid (2x3 = 6 top picks)
    const quickAccess = catalog.slice(0, 6);

    // Jump Back In (recent listening or liked)
    const jumpBackIn = catalog.slice(2, 8);

    return NextResponse.json({
      hero: heavyRotation[0] || catalog[0] || null,
      quickAccess,
      heavyRotation,
      discoveryMix,
      artistSpotlight,
      jumpBackIn,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
