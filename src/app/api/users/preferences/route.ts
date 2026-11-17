import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PreferencesUpdateSchema = z.object({
  preferredLanguages: z.array(z.string()).optional(),
  preferredGenres: z.array(z.string()).optional(),
  topArtists: z.array(z.string()).optional(),
  dislikedTrackIds: z.array(z.string()).optional(),
  dislikedArtistNames: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      // Default preferences for guest users
      return NextResponse.json({
        preferences: {
          preferredLanguages: ['hindi', 'malayalam', 'tamil', 'punjabi'],
          preferredGenres: ['Bollywood', 'Mollywood', 'Kollywood', 'Indie', 'Acoustic'],
          topArtists: [],
          dislikedTrackIds: [],
          dislikedArtistNames: [],
        },
      });
    }

    const pref = await prisma.userPreference.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      preferences: pref || {
        preferredLanguages: ['hindi', 'malayalam', 'tamil', 'punjabi'],
        preferredGenres: ['Bollywood', 'Mollywood', 'Kollywood', 'Indie', 'Acoustic'],
        topArtists: [],
        dislikedTrackIds: [],
        dislikedArtistNames: [],
      },
    });
  } catch (error) {
    console.error('[API preferences GET] error:', error);
    return NextResponse.json({ error: 'Failed to retrieve preferences' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PreferencesUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredLanguages: parsed.data.preferredLanguages || [],
        preferredGenres: parsed.data.preferredGenres || [],
        topArtists: parsed.data.topArtists || [],
        dislikedTrackIds: parsed.data.dislikedTrackIds || [],
        dislikedArtistNames: parsed.data.dislikedArtistNames || [],
      },
      update: {
        preferredLanguages: parsed.data.preferredLanguages,
        preferredGenres: parsed.data.preferredGenres,
        topArtists: parsed.data.topArtists,
        dislikedTrackIds: parsed.data.dislikedTrackIds,
        dislikedArtistNames: parsed.data.dislikedArtistNames,
      },
    });

    // Invalidate recommendation cache so user immediately sees recommendations in updated languages
    await prisma.recommendationCache.deleteMany({
      where: { cacheKey: `discover_user_${user.id}` },
    });

    return NextResponse.json({ success: true, preferences: updated });
  } catch (error) {
    console.error('[API preferences PUT] error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

