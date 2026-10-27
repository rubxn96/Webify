import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { extractPlaylistMetadata, processImportJob } from '@/lib/queue/importQueue';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Playlist URL is required' }, { status: 400 });
    }

    // Extract metadata
    const metadata = await extractPlaylistMetadata(url);

    // Create background import job
    const job = await prisma.importJob.create({
      data: {
        userId: user.id,
        source: metadata.source,
        sourceUrl: url,
        playlistTitle: metadata.title,
        totalTracks: metadata.tracks.length,
        matchedTracks: 0,
        status: 'pending',
        unresolvedTracks: '[]',
      },
    });

    // Start asynchronous worker processing (in background)
    processImportJob(job.id, user.id, metadata.tracks, metadata.title);

    return NextResponse.json({
      jobId: job.id,
      title: metadata.title,
      totalTracks: metadata.tracks.length,
      source: metadata.source,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

