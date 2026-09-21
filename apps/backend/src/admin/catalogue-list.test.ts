import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { prisma } from '@bandit/database';
import { catalogueQuery, catalogueSql, catalogueRepository } from './catalogue-list.js';
import { adminRepository } from './repository.js';
import { createApp } from '../app.js';

afterEach(() => mock.restoreAll());
test('catalogue filters reject unbounded pages and unknown sort expressions', () => {
  for (const input of [
    { page: 0 },
    { page: 1.5 },
    { page: 10001 },
    { sort: 'name; DROP TABLE' },
    { filter: 'hidden' },
    { search: 'x'.repeat(151) },
  ]) {
    assert.equal(catalogueQuery.safeParse(input).success, false);
  }
});
test('search, category and pagination are parameterized; wildcard searches are literal', () => {
  const input = "x%' OR TRUE --_";
  const sql = catalogueSql({ search: input, category: 'category-id', page: 2 });
  assert.ok(!sql.text.includes(input));
  assert.ok(!sql.text.includes('category-id'));
  assert.ok(sql.values.includes("%x\\%' OR TRUE --\\_%"));
  assert.ok(sql.values.includes(20));
});
test('catalogue list and detail require an administrator, and missing details return 404', async () => {
  let role = 'STAFF';
  mock.method(adminRepository, 'session', async () => ({
    expiresAt: new Date(Date.now() + 60000),
    staff: { id: 'admin', email: 'admin@example.test', name: 'Admin', role, isActive: true },
  }));
  let queries = 0;
  mock.method(prisma, '$queryRaw', async () => {
    queries++;
    return [{ result: { items: [], total: 0 } }];
  });
  mock.method(catalogueRepository, 'detail', async () => null);
  const server = createApp({ checkDatabase: async () => {} }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/admin`;
  const get = (path: string) =>
    fetch(origin + path, { headers: { Cookie: 'bandit_staff_session=test' } });
  try {
    assert.equal((await get('/products')).status, 403);
    assert.equal((await get('/products/missing')).status, 403);
    assert.equal(queries, 0);
    role = 'ADMIN';
    assert.equal((await get('/products')).status, 200);
    assert.equal((await get('/products/missing')).status, 404);
    assert.equal((await get('/products?sort=invalid')).status, 400);
    assert.equal(queries, 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
