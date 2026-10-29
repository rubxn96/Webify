import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseTables } from '@/lib/db/autoInit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const result = await ensureDatabaseTables();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Setup failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

