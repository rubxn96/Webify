import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/youtube/search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const tracks = await searchTracks(query, limit);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ tracks: [], error: 'Search failed' }, { status: 500 });
  }
}
