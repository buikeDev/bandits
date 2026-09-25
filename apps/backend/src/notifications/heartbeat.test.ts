import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workerStatus } from './heartbeat.js';

test('notification worker status distinguishes disabled, absent, healthy and stale workers', () => {
  assert.equal(workerStatus(undefined, false).status, 'DISABLED');
  assert.equal(workerStatus(undefined, true).status, 'NOT_STARTED');
  const now = Date.now();
  const row = {
    startedAt: new Date(now - 60_000),
    lastSeenAt: new Date(now - 1_000),
    lastSuccessAt: new Date(now - 1_000),
    lastError: null,
  };
  assert.equal(workerStatus(row, true, now).status, 'HEALTHY');
  assert.equal(
    workerStatus({ ...row, lastSeenAt: new Date(now - 90_001) }, true, now).status,
    'STALE'
  );
});
