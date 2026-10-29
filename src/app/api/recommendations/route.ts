import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { updateAndPersistTasteProfile } from '@/server/recommendation/tasteProfile';
import {
  rankMadeForYou,
  rankHeavyRotation,
  rankDiscoveryStation,
} from '@/server/recommendation/ranking';
import prisma from '@/lib/db/prisma';
import { Track } from '@/types';
import { SEED_TRACKS } from '@/lib/db/seedData';
import { ensureDatabaseTables } from '@/lib/db/autoInit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user?.id;

    // 1. Get or update user taste profile centroid
    let tasteVector = Array.isArray(user?.tasteVector) && user.tasteVector.length > 0
      ? user.tasteVector
      : [0.72, 0.58, 0.65, 0.22, 0.68, 0.08, 0.06, 0.2];

    let aiTasteProfile = {
      summary: 'AI Engine initialized: Calibrated to your listening profile.',
      dominantGenres: ['Bollywood', 'Kollywood', 'Mollywood', 'Desi Pop'],
      energyLevel: tasteVector[0] || 0.7,
      danceability: tasteVector[4] || 0.65,
      acousticness: tasteVector[3] || 0.2,
      totalListens: 0,
    };

    if (userId) {
      try {
        const calibrated = await updateAndPersistTasteProfile(userId);
        tasteVector = calibrated.tasteVector;
        aiTasteProfile = calibrated.profile;
      } catch {
        // Use cached taste vector
      }
    }

    // 2. Fetch parallel recommendation rails
    const [aiRecommendations, heavyRotation, discoveryMix] = await Promise.all([
      rankMadeForYou(tasteVector, userId, 16),
      rankHeavyRotation(userId, 10),
      rankDiscoveryStation(tasteVector, userId, 12),
    ]);

    // 3. Select Hero & Quick Access (6 picks)
    let allCatalog: any[] = [];
    try {
      allCatalog = await prisma.track.findMany({ take: 15 });
    } catch {
      allCatalog = [];
      ensureDatabaseTables().catch(() => {});
    }

    const fallbackCatalog: Track[] = allCatalog.length > 0
      ? allCatalog.map((t) => ({
          id: t.id,
          youtubeId: t.youtubeId,
          title: t.title,
          artist: t.artist,
          album: t.album || undefined,
          duration: t.duration,
          thumbnail: t.thumbnail,
          source: 'catalog',
          aiMatch: 92,
        }))
      : SEED_TRACKS.slice(0, 15).map((st, idx) => ({
          id: `seed-${idx}`,
          ...st,
          source: 'catalog' as const,
          aiMatch: 92,
        }));

    const hero =
      heavyRotation[0] ||
      aiRecommendations[0] ||
      discoveryMix[0] ||
      fallbackCatalog[0] ||
      null;

    const quickPool = [...aiRecommendations, ...discoveryMix, ...fallbackCatalog];
    const seenQuick = new Set<string>();
    const quickAccess: Track[] = [];

    for (const t of quickPool) {
      if (!seenQuick.has(t.youtubeId)) {
        seenQuick.add(t.youtubeId);
        quickAccess.push(t);
      }
      if (quickAccess.length >= 6) break;
    }

    const artistName = hero?.artist || 'Arijit Singh';
    const artistSpotlight = {
      artist: artistName,
      tracks: [...aiRecommendations, ...fallbackCatalog]
        .filter((t) => t.artist.toLowerCase().includes(artistName.toLowerCase()))
        .slice(0, 6),
    };

    return NextResponse.json({
      hero,
      quickAccess,
      aiRecommendations,
      historyBasedTracks: aiRecommendations.slice(0, 8),
      heavyRotation,
      discoveryMix,
      artistSpotlight,
      aiTasteProfile,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
