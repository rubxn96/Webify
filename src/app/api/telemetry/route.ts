import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/middleware/authorization';
import { TelemetrySchema } from '@/server/middleware/validation';
import { historyService } from '@/server/modules/history/history.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const parsed = TelemetrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid telemetry payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const telemetry = await historyService.recordInteraction({
      userId: user?.id,
      trackId: parsed.data.trackId,
      event: parsed.data.event,
      progressSeconds: parsed.data.progressSeconds,
      durationSeconds: parsed.data.durationSeconds,
    });

    return NextResponse.json({ success: true, telemetryId: telemetry.id });
  } catch (error) {
    console.error('Telemetry ingestion error:', error);
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}
