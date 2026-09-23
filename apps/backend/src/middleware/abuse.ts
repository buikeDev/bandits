import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { AppError } from '../errors/app-error.js';

const localSecret = randomBytes(32).toString('hex');
const memory = new Map<string, { count: number; expires: number }>();
const script =
  "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}";
const secret = () => process.env.ABUSE_KEY_SECRET || localSecret;
export const privateKey = (value: string) =>
  createHmac('sha256', secret()).update(value).digest('hex');
export function validateAbuseConfig() {
  const mode = process.env.ABUSE_STORE ?? 'memory';
  if (!['memory', 'redis'].includes(mode)) throw new Error('Invalid ABUSE_STORE');
  if (mode === 'redis') {
    const url = new URL(process.env.UPSTASH_REDIS_REST_URL ?? '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !process.env.UPSTASH_REDIS_REST_TOKEN ||
      (process.env.ABUSE_KEY_SECRET?.length ?? 0) < 32
    )
      throw new Error(
        'Configure Redis URL, token and a shared ABUSE_KEY_SECRET of at least 32 characters'
      );
  }
}
export async function consume(
  key: string,
  maximum: number,
  windowMs: number,
  now = Date.now()
): Promise<number> {
  let count: number;
  let ttl: number;
  if (process.env.ABUSE_STORE === 'redis') {
    try {
      const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EVAL', script, '1', `bandit:abuse:${key}`, String(windowMs)]),
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { result?: number[] };
      if (
        !Array.isArray(body.result) ||
        body.result.length !== 2 ||
        !body.result.every(Number.isFinite) ||
        body.result[1] < 0
      )
        throw new Error();
      [count, ttl] = body.result;
    } catch {
      throw new AppError(
        'This action is temporarily unavailable. Please try again shortly.',
        503,
        'ABUSE_STORE_UNAVAILABLE'
      );
    }
  } else {
    for (const [id, value] of memory) if (value.expires <= now) memory.delete(id);
    let entry = memory.get(key);
    if (!entry) {
      if (memory.size >= 20000)
        throw new AppError('Please try again shortly.', 503, 'ABUSE_STORE_FULL');
      entry = { count: 0, expires: now + windowMs };
      memory.set(key, entry);
    }
    count = ++entry.count;
    ttl = entry.expires - now;
  }
  return count > maximum ? Math.max(1, Math.ceil(ttl / 1000)) : 0;
}
export async function enforce(
  res: Response,
  scope: string,
  identity: string,
  maximum: number,
  windowMs: number
) {
  const configured = Number(process.env[`ABUSE_${scope.toUpperCase()}_LIMIT`] ?? maximum);
  const retry = await consume(
    `${scope}:${privateKey(identity)}`,
    Number.isSafeInteger(configured) && configured > 0 ? configured : maximum,
    windowMs
  );
  if (retry) {
    res.setHeader('Retry-After', retry);
    res.setHeader('Cache-Control', 'no-store');
    console.warn(JSON.stringify({ event: 'abuse_limit', scope, time: new Date().toISOString() }));
    throw new AppError(
      `Too many attempts. Please try again in ${retry} seconds.`,
      429,
      'RATE_LIMITED'
    );
  }
}
export const clientIdentity = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';
export function guard(scope: string, maximum: number, seconds: number): RequestHandler {
  return (req, res, next) => {
    void enforce(res, scope, clientIdentity(req), maximum, seconds * 1000)
      .then(() => next())
      .catch((error: unknown) => {
        if (scope.startsWith('oauth_') && error instanceof AppError) {
          res
            .status(error.statusCode)
            .type('html')
            .send(
              '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in temporarily unavailable</title><main style="max-width:32rem;margin:4rem auto;padding:1rem;font-family:Arial"><h1>Please try again shortly</h1><p>Sign-in is temporarily limited or unavailable. Your account has not been changed.</p><a href="/login">Return to sign in</a></main></html>'
            );
        } else next(error);
      });
  };
}
export function guestIdentity(req: Request, res: Response): string {
  const raw = req.headers.cookie
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('bandit_guest='))
    ?.slice(13);
  const [id, signature] = (raw ?? '').split('.');
  if (
    id &&
    /^[a-f0-9]{32}$/.test(id) &&
    signature &&
    /^[a-f0-9]{64}$/.test(signature) &&
    timingSafeEqual(Buffer.from(privateKey(`guest:${id}`)), Buffer.from(signature))
  )
    return id;
  const fresh = randomBytes(16).toString('hex');
  res.cookie('bandit_guest', `${fresh}.${privateKey(`guest:${fresh}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400000,
  });
  return fresh;
}
