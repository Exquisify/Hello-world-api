import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  isPremium: boolean;
  walletAddress?: string | null;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${header}.${encodedPayload}.${signature}`;
}

function verifySignature(token: string): { userId: string } | null {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as {
      userId?: string;
      exp?: number;
    };

    if (!decoded.userId) {
      return null;
    }

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  return signToken({ userId, iat: issuedAt, exp: issuedAt + 7 * 24 * 60 * 60 });
}

export function verifyToken(token: string): { userId: string } | null {
  return verifySignature(token);
}

export async function getCurrentUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        isPremium: true,
        walletAddress: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthError('Authentication required');
  }

  return user;
}

export async function requirePremium(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!user.isPremium) {
    throw new AuthError('Premium subscription required');
  }

  return user;
}
