import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, test } from 'node:test';
import { createApp } from './app.js';

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function request(path: string, options?: RequestInit): Promise<Response> {
  server = createApp({ checkDatabase: async () => {} }).listen(0);
  const { port } = server.address() as AddressInfo;
  return fetch(`http://127.0.0.1:${port}${path}`, options);
}

test('health endpoint reports that the process is alive', async () => {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/i);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
});

test('unexpected errors have a safe structured log and a request ID', async () => {
  const original = console.error;
  const messages: unknown[][] = [];
  console.error = (...args: unknown[]) => messages.push(args);
  try {
    server = createApp({ checkDatabase: async () => { throw new Error('database password is private'); } }).listen(0);
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/api/ready?token=private`);
    assert.equal(response.status, 500);
    assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/i);
    assert.deepEqual(await response.json(), { success: false, error: 'Internal server error' });
  } finally {
    console.error = original;
  }
  assert.equal(messages.length, 1);
  const log = JSON.parse(String(messages[0][0])) as Record<string, unknown>;
  assert.deepEqual(log.event, 'api_error');
  assert.equal(log.path, '/api/ready');
  assert.equal(JSON.stringify(log).includes('private'), false);
});

test('readiness endpoint checks the database', async () => {
  const response = await request('/api/ready');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { status: 'ready', database: 'connected' },
  });
});

test('unknown routes return a standard error', async () => {
  const response = await request('/missing');
  assert.equal(response.status, 404);
  assert.equal((await response.json() as { success: boolean }).success, false);
});

test('password registration directs customers to social sign-up', async () => {
  const response = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Create your account with Google or Apple.',
    code: 'SOCIAL_SIGNUP_REQUIRED',
  });
});

test('current customer endpoint requires a session', async () => {
  const response = await request('/api/auth/me');
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Authentication required',
    code: 'UNAUTHENTICATED',
  });
});
