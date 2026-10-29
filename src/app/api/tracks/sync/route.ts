import { NextRequest, NextResponse } from 'next/server';
import { SyncTrackSchema } from '@/server/middleware/validation';
import { catalogService } from '@/server/modules/catalog/catalog.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SyncTrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing required track fields', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const track = await catalogService.syncTrack(parsed.data);
    return NextResponse.json({ success: true, track });
  } catch (error) {
    console.error('Track sync error:', error);
    return NextResponse.json({ error: 'Failed to sync track' }, { status: 500 });
  }
}
