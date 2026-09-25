import { createHash, randomBytes } from 'node:crypto';
import { Router, type CookieOptions } from 'express';
import { z } from 'zod';
import { prisma } from '@bandit/database';
import { issueSession } from './service.js';
import { setSessionCookie } from './session.js';

const cookieName = 'bandit_oauth_verifier';
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/oauth',
});
function settings() {
  let url: URL;
  let origin: URL;
  try {
    url = new URL(process.env.SUPABASE_URL ?? '');
  } catch {
    throw new Error('SUPABASE_URL_INVALID');
  }
  try {
    origin = new URL(process.env.CUSTOMER_AUTH_ORIGIN ?? 'http://localhost:3000');
  } catch {
    throw new Error('CUSTOMER_AUTH_ORIGIN_INVALID');
  }
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co'))
    throw new Error('SUPABASE_URL_INVALID');
  if (!key) throw new Error('SUPABASE_PUBLISHABLE_KEY_MISSING');
  if (
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    (origin.protocol !== 'https:' &&
      !(
        process.env.NODE_ENV !== 'production' &&
        origin.hostname === 'localhost' &&
        origin.protocol === 'http:'
      ))
  )
    throw new Error('CUSTOMER_AUTH_ORIGIN_INVALID');
  return { url: url.origin, origin: origin.origin, key };
}
export function safeCustomerReturn(value: unknown): string {
  return typeof value === 'string' &&
    /^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(value) &&
    !value.startsWith('/api/')
    ? value
    : '/account';
}
const identitySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  email_confirmed_at: z.string().min(1),
  identities: z.array(z.object({ provider: z.string() })),
  user_metadata: z
    .object({ full_name: z.string().optional(), name: z.string().optional() })
    .optional(),
});
export const oauthRouter: ReturnType<typeof Router> = Router();
oauthRouter.get('/providers', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    settings();
    res.json({
      success: true,
      data: {
        google: process.env.CUSTOMER_GOOGLE_ENABLED === 'true',
        apple: process.env.CUSTOMER_APPLE_ENABLED === 'true',
      },
    });
  } catch (error) {
    // This code identifies a missing or malformed setting without exposing keys,
    // tokens, URLs with credentials, or provider responses.
    const configuration =
      error instanceof Error &&
      [
        'SUPABASE_URL_INVALID',
        'SUPABASE_PUBLISHABLE_KEY_MISSING',
        'CUSTOMER_AUTH_ORIGIN_INVALID',
      ].includes(error.message)
        ? error.message
        : 'UNAVAILABLE';
    res.json({ success: true, data: { google: false, apple: false }, configuration });
  }
});
oauthRouter.get('/start/:provider', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const config = settings();
    const provider = z.enum(['google', 'apple']).parse(req.params.provider);
    if (process.env[`CUSTOMER_${provider.toUpperCase()}_ENABLED`] !== 'true')
      throw new Error('Provider disabled');
    const verifier = randomBytes(48).toString('base64url');
    // PKCE binds the one-time code to this browser's HttpOnly cookie.
    res.cookie(
      cookieName,
      JSON.stringify({
        verifier,
        provider,
        next: safeCustomerReturn(req.query.next),
        expires: Date.now() + 600_000,
      }),
      { ...cookieOptions(), maxAge: 600_000 }
    );
    const authorize = new URL(`${config.url}/auth/v1/authorize`);
    authorize.search = new URLSearchParams({
      provider,
      redirect_to: `${config.origin}/api/auth/oauth/callback`,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 's256',
    }).toString();
    res.redirect(authorize.toString());
  } catch {
    res.redirect('/login?oauth=unavailable');
  }
});
oauthRouter.get('/callback', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.clearCookie(cookieName, cookieOptions());
  let origin = '';
  try {
    const config = settings();
    origin = config.origin;
    const raw = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    const flow = z
      .object({
        verifier: z.string().regex(/^[A-Za-z0-9_-]{64}$/),
        provider: z.enum(['google', 'apple']),
        next: z.string(),
        expires: z.number(),
      })
      .parse(JSON.parse(decodeURIComponent(raw ?? '')));
    if (
      flow.expires < Date.now() ||
      process.env[`CUSTOMER_${flow.provider.toUpperCase()}_ENABLED`] !== 'true'
    )
      throw new Error('Expired flow');
    const code = z.string().min(1).max(2048).parse(req.query.code);
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: { apikey: config.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: code, code_verifier: flow.verifier }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Code exchange failed');
    const session = z.object({ access_token: z.string().min(1) }).parse(await response.json());
    const verified = await fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.key, Authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!verified.ok) throw new Error('Identity verification failed');
    const user = identitySchema.parse(await verified.json());
    if (!user.identities.some((identity) => identity.provider === flow.provider))
      throw new Error('Provider mismatch');
    let customer = await prisma.customerAccount.findUnique({ where: { supabaseAuthId: user.id } });
    if (!customer) {
      const email = user.email.toLowerCase();
      // Legacy emails were not verified. Never merge orders based on email alone.
      if (await prisma.customerAccount.findUnique({ where: { email } })) {
        res.redirect(`${origin}/login?oauth=existing-account`);
        return;
      }
      customer = await prisma.customerAccount.create({
        data: {
          supabaseAuthId: user.id,
          email,
          name: (user.user_metadata?.full_name || user.user_metadata?.name || 'Customer').slice(
            0,
            100
          ),
        },
      });
    }
    setSessionCookie(res, await issueSession(customer.id));
    res.redirect(`${origin}${safeCustomerReturn(flow.next)}`);
  } catch {
    // Do not log authorization codes, provider tokens or profile data.
    res.redirect(`${origin}/login?oauth=failed`);
  }
});
