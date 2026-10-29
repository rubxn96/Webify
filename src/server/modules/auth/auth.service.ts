import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { signToken } from '@/lib/auth/jwt';
import { UserSettings } from '@/types';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  bitrate: 'high',
  normalization: true,
  crossfade: 2,
  eqEnabled: true,
  eqPreset: 'Flat',
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export class AuthService {
  public async register(data: { email: string; username: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        preferences: DEFAULT_USER_SETTINGS as any,
        tasteVector: [0.72, 0.58, 0.65, 0.22, 0.68, 0.08, 0.06, 0.2],
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        settings: user.preferences || DEFAULT_USER_SETTINGS,
      },
      token,
    };
  }

  public async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid email or password.');
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        settings: user.preferences || DEFAULT_USER_SETTINGS,
      },
      token,
    };
  }

  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      settings: (user.preferences as any) || DEFAULT_USER_SETTINGS,
      preferences: user.preferences,
      tasteVector: user.tasteVector,
    };
  }

  public async updatePreferences(userId: string, partial: Partial<UserSettings>) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const currentSettings = (user?.preferences as any) || DEFAULT_USER_SETTINGS;
    const merged = { ...currentSettings, ...partial };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { preferences: merged as any },
    });

    return {
      settings: updated.preferences,
    };
  }
}

export const authService = new AuthService();

