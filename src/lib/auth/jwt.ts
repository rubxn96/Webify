import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'obsidian-fallback-secret-2026';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: NextRequest) {
  try {
    // Check Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');

    if (!token) {
      const cookie = req.cookies.get('webify_token') || req.cookies.get('obsidian_token');
      token = cookie?.value;
    }

    if (!token) {
      // Fallback: return default user for seamless experience
      return await prisma.user.findFirst({
        where: { email: { in: ['user@webify.audio', 'user@obsidian.audio'] } },
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return await prisma.user.findFirst({
        where: { email: { in: ['user@webify.audio', 'user@obsidian.audio'] } },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user;
  } catch (err) {
    // Return null if database is offline / connecting
    return null;
  }
}

