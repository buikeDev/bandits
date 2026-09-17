import { prisma } from '@bandit/database';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { createSessionToken, hashSessionToken } from '../customer-auth/session.js';
import { verifyPassword } from '../customer-auth/password.js';
import { adminRepository } from './repository.js';

const cookie = 'bandit_staff_session';
const duration = 8 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/admin',
};
export type Staff = { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF' };
export const publicStaff = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
} as const;
export function staffToken(req: Request) {
  const value = req.headers.cookie
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookie}=`));
  return value?.slice(cookie.length + 1) ?? '';
}
export async function currentStaff(req: Request): Promise<Staff> {
  const token = staffToken(req);
  if (!token) throw new AppError('Staff sign-in required', 401, 'UNAUTHENTICATED');
  const session = await adminRepository.session(hashSessionToken(token));
  if (!session || session.expiresAt <= new Date() || !session.staff.isActive)
    throw new AppError('Staff session expired', 401, 'UNAUTHENTICATED');
  const { id, name, email, role } = session.staff;
  return { id, name, email, role };
}
export function requireAdmin(staff: Staff) {
  if (staff.role !== 'ADMIN') throw new AppError('Administrator access required', 403, 'FORBIDDEN');
}
export async function loginStaff(email: string, password: string, res: Response) {
  const staff = await prisma.staffAccount.findUnique({ where: { email } });
  // Always perform a password derivation, including unknown accounts.
  const valid = await verifyPassword(
    password,
    staff?.passwordHash ?? `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`
  );
  if (!staff?.isActive || !valid)
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  const token = createSessionToken();
  await prisma.staffSession.create({
    data: {
      staffId: staff.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + duration),
    },
  });
  res.cookie(cookie, token, { ...cookieOptions, maxAge: duration });
  return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
}
export async function logoutStaff(req: Request, res: Response) {
  await prisma.staffSession.deleteMany({ where: { tokenHash: hashSessionToken(staffToken(req)) } });
  res.clearCookie(cookie, cookieOptions);
}

// Custom header forces a CORS preflight for cross-origin writes; browsers cannot
// submit privileged mutations through a cross-site HTML form.
export function protectWrite(req: Request, _res: Response, next: NextFunction) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Bandit-Admin') !== '1') {
    next(new AppError('Invalid admin request', 403, 'FORBIDDEN'));
    return;
  }
  next();
}
const attempts = new Map<string, { count: number; until: number }>();
export function limitLogin(req: Request, _res: Response, next: NextFunction) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = req.ip ?? 'unknown';
  const entry = attempts.get(key) ?? { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 20) {
    next(new AppError('Too many attempts. Try again in 15 minutes.', 429, 'RATE_LIMITED'));
    return;
  }
  next();
}
