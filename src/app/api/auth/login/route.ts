import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/server/middleware/validation';
import { authService } from '@/server/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid login input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { user, token } = await authService.login(parsed.data);

    const response = NextResponse.json({ user, token });
    response.cookies.set('obsidian_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    const status = error.message?.includes('Invalid') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status });
  }
}
