import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'bandit_customer_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const hashSessionToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
export const createSessionToken = (): string => randomBytes(32).toString('base64url');

export function readSessionToken(req: Request): string | null {
  for (const cookie of req.headers.cookie?.split(';') ?? []) {
    const [name, ...value] = cookie.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join('='));
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
