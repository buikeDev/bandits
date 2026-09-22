import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { config as loadEnvironment } from 'dotenv';

loadEnvironment({ path: '../../packages/database/.env' });

test(
  'legacy customer session, logout, and login; password signup disabled',
  {
    skip: process.env.RUN_DATABASE_TESTS !== 'true',
  },
  async () => {
    const [{ prisma }, { createApp }] = await Promise.all([
      import('@bandit/database'),
      import('../app.js'),
    ]);
    const email = `auth-test-${Date.now()}@bandit.invalid`;
    let server: Server | undefined;

    try {
      server = createApp({ checkDatabase: async () => {} }).listen(0);
      const { port } = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}/api/auth`;

      const registered = await fetch(`${url}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auth Test',
          email,
          password: 'correct horse battery staple',
        }),
      });
      assert.equal(registered.status, 410);
      // Seed a legacy password account; public password registration is disabled.
      const { customerAuthService } = await import('./service.js');
      const legacy = await customerAuthService.register({
        name: 'Auth Test',
        email,
        password: 'correct horse battery staple',
      });
      const cookie = `bandit_customer_session=${legacy.token}`;

      const stored = await prisma.customerAccount.findUniqueOrThrow({ where: { email } });
      assert.notEqual(stored.passwordHash, 'correct horse battery staple');

      const current = await fetch(`${url}/me`, { headers: { Cookie: cookie ?? '' } });
      assert.equal(current.status, 200);

      const loggedOut = await fetch(`${url}/logout`, {
        method: 'POST',
        headers: { Cookie: cookie ?? '' },
      });
      assert.equal(loggedOut.status, 204);

      const loginResponse = await fetch(`${url}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'correct horse battery staple' }),
      });
      assert.equal(loginResponse.status, 200);
      assert.match(loginResponse.headers.get('set-cookie') ?? '', /HttpOnly/i);
      assert.match(loginResponse.headers.get('set-cookie') ?? '', /SameSite=Lax/i);
    } finally {
      server?.close();
      await prisma.customerAccount.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
  }
);
