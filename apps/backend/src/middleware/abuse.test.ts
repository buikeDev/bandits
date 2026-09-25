import assert from 'node:assert/strict';
import { test } from 'node:test';
import { consume, privateKey, validateAbuseConfig } from './abuse.js';
import { createApp } from '../app.js';
import type { AddressInfo } from 'node:net';

test('limits expire without extending cooldowns and identities are hashed', async () => {
  assert.doesNotMatch(privateKey('customer@example.com'), /customer|example/);
  assert.equal(await consume('expiry-test', 1, 1000, 100), 0);
  assert.equal(await consume('expiry-test', 1, 1000, 101), 1);
  assert.equal(await consume('expiry-test', 1, 1000, 1100), 0);
});
test('forwarded headers cannot bypass limits and responses include Retry-After', async () => {
  const saved = process.env.ABUSE_PRICING_IP_LIMIT;
  process.env.ABUSE_PRICING_IP_LIMIT = '1';
  const server = createApp({ checkDatabase: async () => {} }).listen(0);
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/orders/price`;
    const send = (ip: string) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
        body: '{}',
      });
    assert.equal((await send('1.1.1.1')).status, 400);
    const limited = await send('2.2.2.2');
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  } finally {
    if (saved === undefined) delete process.env.ABUSE_PRICING_IP_LIMIT;
    else process.env.ABUSE_PRICING_IP_LIMIT = saved;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test('Redis counters are atomic and outages fail closed', async () => {
  const saved = process.env.ABUSE_STORE;
  const original = globalThis.fetch;
  process.env.ABUSE_STORE = 'redis';
  try {
    globalThis.fetch = async (_url, options) => {
      const command = JSON.parse(String(options?.body));
      assert.equal(command[0], 'EVAL');
      assert.match(command[1], /PEXPIRE/);
      return new Response(JSON.stringify({ result: [3, 4500] }));
    };
    assert.equal(await consume('redis-test', 2, 5000), 5);
    globalThis.fetch = async () => {
      throw new Error('private provider error');
    };
    await assert.rejects(
      consume('redis-test', 2, 5000),
      (e: unknown) => (e as { code: string }).code === 'ABUSE_STORE_UNAVAILABLE'
    );
  } finally {
    globalThis.fetch = original;
    if (saved === undefined) delete process.env.ABUSE_STORE;
    else process.env.ABUSE_STORE = saved;
  }
});

test('production requires shared Redis limits and a durable signing secret', () => {
  const saved = {
    nodeEnv: process.env.NODE_ENV,
    store: process.env.ABUSE_STORE,
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    secret: process.env.ABUSE_KEY_SECRET,
  };
  try {
    process.env.NODE_ENV = 'production';
    process.env.ABUSE_STORE = 'memory';
    process.env.ABUSE_KEY_SECRET = 'a'.repeat(32);
    assert.throws(validateAbuseConfig, /ABUSE_STORE=redis/);

    process.env.ABUSE_STORE = 'redis';
    delete process.env.ABUSE_KEY_SECRET;
    assert.throws(validateAbuseConfig, /ABUSE_KEY_SECRET/);

    process.env.ABUSE_KEY_SECRET = 'a'.repeat(32);
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.throws(validateAbuseConfig, /Configure Redis URL/);

    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    assert.doesNotThrow(validateAbuseConfig);
  } finally {
    if (saved.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = saved.nodeEnv;
    if (saved.store === undefined) delete process.env.ABUSE_STORE;
    else process.env.ABUSE_STORE = saved.store;
    if (saved.url === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = saved.url;
    if (saved.token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = saved.token;
    if (saved.secret === undefined) delete process.env.ABUSE_KEY_SECRET;
    else process.env.ABUSE_KEY_SECRET = saved.secret;
  }
});
