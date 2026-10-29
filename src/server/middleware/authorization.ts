import { NextRequest } from 'next/server';
import { getCurrentUser, verifyToken, TokenPayload } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function getAuthenticatedUser(req: NextRequest) {
  return await getCurrentUser(req);
}

export function extractAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookie = req.cookies.get('webify_token') || req.cookies.get('obsidian_token');
  return cookie?.value || null;
}

export function verifyRequestToken(req: NextRequest): TokenPayload | null {
  const token = extractAuthToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function getStrictUser(req: NextRequest) {
  const payload = verifyRequestToken(req);
  if (!payload) return null;
  return await prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

