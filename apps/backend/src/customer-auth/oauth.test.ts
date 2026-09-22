import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app.js';
import { safeCustomerReturn } from './oauth.js';
import { prisma } from '@bandit/database';
import { customerAuthRepository } from './repository.js';

test('OAuth rejects external return destinations', () => {
  for (const value of [
    '//evil.test',
    '/\\evil.test',
    'https://evil.test',
    '/api/auth/oauth/start/google',
    undefined,
  ])
    assert.equal(safeCustomerReturn(value), '/account');
  assert.equal(safeCustomerReturn('/order?step=2'), '/order?step=2');
});

test('OAuth exchange is browser-bound and never merges an existing email', async () => {
  const env = { ...process.env };
  const originalFetch = globalThis.fetch;
  const find = prisma.customerAccount.findUnique;
  const create = prisma.customerAccount.create;
  const createSession = customerAuthRepository.createSession;
  let exchanged = 0;
  let created = 0;
  let conflict = false;
  let sessions = 0;
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-key';
  process.env.CUSTOMER_AUTH_ORIGIN = 'http://localhost:3000';
  process.env.CUSTOMER_GOOGLE_ENABLED = 'true';
  process.env.NODE_ENV = 'test';
  const server = createApp({ checkDatabase: async () => {} }).listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/auth`;
  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.startsWith('https://test.supabase.co')) {
        if (url.includes('/token?')) {
          exchanged++;
          assert.match(String(init?.body), /code_verifier/);
          return new Response(JSON.stringify({ access_token: 'verified-token' }));
        }
        return new Response(
          JSON.stringify({
            id: 'd9f3e6f4-6ef3-4f86-9461-6a16d6692923',
            email: 'customer@example.com',
            email_confirmed_at: new Date().toISOString(),
            identities: [{ provider: 'google' }],
            user_metadata: { full_name: 'Customer' },
          })
        );
      }
      return originalFetch(input, init);
    };
    prisma.customerAccount.findUnique = (async (args: { where: { email?: string } }) =>
      conflict && args.where.email ? { id: 'legacy' } : null) as unknown as typeof find;
    prisma.customerAccount.create = (async () => {
      created++;
      return { id: 'new-customer' };
    }) as unknown as typeof create;
    customerAuthRepository.createSession = (async () => {
      sessions++;
      return {};
    }) as unknown as typeof createSession;
    const missing = await fetch(`${base}/oauth/callback?code=stolen`, { redirect: 'manual' });
    assert.match(missing.headers.get('location') ?? '', /oauth=failed/);
    assert.equal(exchanged, 0);
    const start = await fetch(`${base}/oauth/start/google?next=//evil.test`, {
      redirect: 'manual',
    });
    const cookie = start.headers.get('set-cookie')?.split(';')[0] ?? '';
    assert.match(start.headers.get('set-cookie') ?? '', /HttpOnly/);
    assert.match(start.headers.get('location') ?? '', /code_challenge_method=s256/);
    const success = await fetch(`${base}/oauth/callback?code=valid`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    });
    assert.equal(success.headers.get('location'), 'http://localhost:3000/account');
    assert.match(success.headers.get('set-cookie') ?? '', /bandit_customer_session/);
    assert.equal(created, 1);
    assert.equal(sessions, 1);
    conflict = true;
    const collision = await fetch(`${base}/oauth/callback?code=another`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    });
    assert.match(collision.headers.get('location') ?? '', /oauth=existing-account/);
    assert.equal(sessions, 1);
    assert.equal(created, 1);
    process.env.CUSTOMER_GOOGLE_ENABLED = 'false';
    const disabled = await fetch(`${base}/oauth/start/google`, { redirect: 'manual' });
    assert.match(disabled.headers.get('location') ?? '', /oauth=unavailable/);
    const register = await fetch(`${base}/register`, { method: 'POST' });
    assert.equal(register.status, 410);
  } finally {
    globalThis.fetch = originalFetch;
    prisma.customerAccount.findUnique = find;
    prisma.customerAccount.create = create;
    customerAuthRepository.createSession = createSession;
    for (const key of [
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEY',
      'CUSTOMER_AUTH_ORIGIN',
      'CUSTOMER_GOOGLE_ENABLED',
      'NODE_ENV',
    ]) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
