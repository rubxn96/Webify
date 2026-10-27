import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { generateAIRecommendations, TelemetryInteraction } from '@/lib/recommender/vectorEngine';
import { Track } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // Fetch all catalog tracks
    const dbTracks = await prisma.track.findMany({
      take: 120,
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
      source: 'catalog',
    }));

    // Fetch user telemetry interactions
    let interactions: TelemetryInteraction[] = [];
    if (user) {
      const dbTelemetry = await prisma.telemetry.findMany({
        where: { userId: user.id },
        select: { trackId: true, weight: true, event: true, createdAt: true },
        take: 150,
        orderBy: { createdAt: 'desc' },
      });
      interactions = dbTelemetry;
    } else {
      // Global fallback telemetry if unauthenticated
      const globalTelemetry = await prisma.telemetry.findMany({
        select: { trackId: true, weight: true, event: true, createdAt: true },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
      interactions = globalTelemetry;
    }

    const {
      aiRecommendations,
      historyBasedTracks,
      heavyRotation,
      discoveryMix,
      artistSpotlight,
      aiTasteProfile,
    } = generateAIRecommendations(catalog, interactions);

    // Quick Access Grid (2x3 = 6 fresh daily top picks)
    const quickAccess =
      aiRecommendations.length >= 6
        ? aiRecommendations.slice(0, 6)
        : [...aiRecommendations, ...discoveryMix, ...catalog].slice(0, 6);

    return NextResponse.json({
      hero: heavyRotation[0] || catalog[0] || null,
      quickAccess,
      aiRecommendations,
      historyBasedTracks,
      heavyRotation,
      discoveryMix,
      artistSpotlight,
      aiTasteProfile,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
