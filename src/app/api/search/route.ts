import { NextRequest, NextResponse } from 'next/server';
import { catalogService } from '@/server/modules/catalog/catalog.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const source = (searchParams.get('source') as 'all' | 'youtube' | 'catalog') || 'all';

    const tracks = await catalogService.search(query, limit, source);

    return NextResponse.json({ tracks, query, count: tracks.length });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ tracks: [], error: 'Search failed' }, { status: 500 });
  }
}
