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
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
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

test('registration rejects invalid input before database access', async () => {
  const response = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json() as { success: boolean }).success, false);
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
