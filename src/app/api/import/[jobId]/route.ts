import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let unresolved = [];
    try {
      if (job.unresolvedTracks) {
        unresolved = JSON.parse(job.unresolvedTracks);
      }
    } catch {
      unresolved = [];
    }

    return NextResponse.json({
      id: job.id,
      source: job.source,
      sourceUrl: job.sourceUrl,
      playlistTitle: job.playlistTitle,
      totalTracks: job.totalTracks,
      matchedTracks: job.matchedTracks,
      status: job.status,
      unresolvedTracks: unresolved,
    });
  } catch (error) {
    console.error('Job status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

