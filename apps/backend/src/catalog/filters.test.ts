import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createApp } from '../app.js';
import { catalogRepository } from './repository.js';
import type { ProductListQuery } from '@bandit/shared';

test('shop links pass type and ordering filters to the catalogue and reject unsupported sorts', async () => {
  let query: ProductListQuery | undefined;
  mock.method(catalogRepository, 'listProducts', async (input: ProductListQuery) => {
    query = input;
    return { items: [], total: 0 };
  });
  const server = createApp({ checkDatabase: async () => {} }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/catalog/products`;
  try {
    const wristbands = await fetch(base + '?kind=WRISTBAND');
    assert.equal(wristbands.status, 200);
    assert.match(wristbands.headers.get('cache-control') ?? '', /max-age=20/);
    assert.equal(query?.kind, 'WRISTBAND');
    assert.equal((await fetch(base)).status, 200);
    assert.equal(query?.kind, undefined);
    for (const sort of ['newest', 'best-sellers']) {
      assert.equal(
        (await fetch(base + `?sort=${sort}&category=tyvek&search=yellow&page=2`)).status,
        200
      );
      assert.equal(query?.sort, sort);
      assert.equal(query?.category, 'tyvek');
      assert.equal(query?.search, 'yellow');
      assert.equal(query?.page, 2);
    }
    assert.equal((await fetch(base + '?sort=unsupported')).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    mock.restoreAll();
  }
});
