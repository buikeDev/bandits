import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app.js';
import { createNewsletterLimiter } from './routes.js';

test('newsletter limiter bounds attempts and expires email cooldowns', () => {
  const limit = createNewsletterLimiter();
  assert.equal(limit('a@example.com', 1_000_000), 'allowed');
  assert.equal(limit('a@example.com', 1_000_001), 'duplicate');
  assert.equal(limit('a@example.com', 1_060_001), 'allowed');
  for (let i = 0; i < 98; i++) assert.equal(limit(`${i}@example.com`, 1_060_001), 'allowed');
  assert.equal(limit('last@example.com', 1_060_002), 'limited');
  assert.equal(limit('last@example.com', 1_900_001), 'allowed');
});

test('newsletter validates consent, sends pending only, and sanitizes provider failures', async () => {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  process.env.MAILCHIMP_API_KEY = 'test-secret-us1';
  process.env.MAILCHIMP_SERVER_PREFIX = 'us1';
  process.env.MAILCHIMP_AUDIENCE_ID = 'abc123';
  let calls = 0;
  let providerStatus = 200;
  let providerTitle = '';
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://us1.api.mailchimp.com/')) {
      calls++;
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.status, 'pending');
      assert.equal(body.email_address, body.email_address.toLowerCase());
      return new Response(
        JSON.stringify({ title: providerTitle, detail: 'private-provider-detail' }),
        { status: providerStatus }
      );
    }
    return original(url, init);
  };
  const server = createApp({ checkDatabase: async () => {} }).listen(0);
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/newsletter/subscribe`;
  const post = (data: object) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  try {
    assert.equal((await post({ email: 'bad', consent: true })).status, 400);
    assert.equal((await post({ email: 'a@example.com', consent: false })).status, 400);
    assert.equal(
      (await post({ email: 'bot@example.com', consent: true, website: 'spam' })).status,
      200
    );
    assert.equal(calls, 0);
    const success = await post({ email: ' NEW@Example.com ', consent: true });
    assert.equal(success.status, 200);
    const successBody = await success.json();
    assert.equal((await post({ email: 'new@example.com', consent: true })).status, 429);
    assert.equal(calls, 1);
    providerStatus = 400;
    providerTitle = 'Member Exists';
    const existing = await post({ email: 'existing@example.com', consent: true });
    assert.deepEqual(await existing.json(), successBody);
    providerStatus = 401;
    providerTitle = 'Invalid API Key';
    const failure = await post({ email: 'failure@example.com', consent: true });
    assert.equal(failure.status, 503);
    assert.doesNotMatch(await failure.text(), /private-provider-detail|test-secret/);
    delete process.env.MAILCHIMP_API_KEY;
    const before = calls;
    assert.equal((await post({ email: 'config@example.com', consent: true })).status, 503);
    assert.equal(calls, before);
  } finally {
    globalThis.fetch = original;
    for (const key of ['MAILCHIMP_API_KEY', 'MAILCHIMP_SERVER_PREFIX', 'MAILCHIMP_AUDIENCE_ID']) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
