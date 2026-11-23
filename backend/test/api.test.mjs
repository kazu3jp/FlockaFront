import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';
import { unstable_readConfig, unstable_splitSqlQuery } from 'wrangler';

const config = unstable_readConfig({
  config: fileURLToPath(new URL('../wrangler.local.jsonc', import.meta.url)),
});
const secret = randomBytes(32).toString('hex');
const user = { id: 'test-user', email: 'test@example.com', password: 'test-password' };
const worker = new Miniflare(convertV4MiniflareOptions({
  cf: false,
  modules: true,
  scriptPath: fileURLToPath(new URL('../dist/index.js', import.meta.url)),
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
  bindings: { ...config.vars, JWT_SECRET: secret, MAILCHANNELS_API_KEY: '' },
  d1Databases: ['DB'],
  r2Buckets: ['R2'],
}));

function request(path, options) {
  return worker.dispatchFetch(`http://localhost${path}`, options);
}

before(async () => {
  const db = await worker.getD1Database('DB');
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await db.batch(unstable_splitSqlQuery(schema).map((query) => db.prepare(query)));
  await db.prepare('INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)')
    .bind(user.id, user.email, bcrypt.hashSync(user.password, 4))
    .run();
});

after(() => worker.dispose());

test('health and unknown paths keep their JSON and CORS headers', async () => {
  const health = await request('/');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('access-control-allow-origin'), '*');
  assert.equal((await health.json()).success, true);

  const missing = await request('/not-a-route');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(await missing.json(), {
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

test('protected paths preserve the preflight response', async () => {
  const response = await request('/users/me', {
    method: 'OPTIONS',
    headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'GET' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('access-control-max-age'), '86400');
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /Authorization/);
  assert.deepEqual(await response.json(), {});
});

test('missing, invalid, expired and non-session tokens are rejected', async () => {
  const missing = await request('/auth/me');
  assert.equal(missing.status, 401);
  assert.deepEqual(await missing.json(), {
    success: false,
    error: 'Authorization header is missing or invalid',
  });

  const expired = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: -1 });
  const verification = jwt.sign(
    { userId: user.id, purpose: 'email_verification' },
    secret,
    { expiresIn: '24h' },
  );

  for (const token of ['invalid', expired, verification]) {
    const response = await request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      error: 'Invalid or expired token',
    });
  }
});

test('login and account information work under both URL prefixes', async () => {
  for (const prefix of ['/auth', '/users']) {
    const login = await request(`${prefix}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    assert.equal(login.status, 200);
    const { data } = await login.json();
    assert.equal(data.user.id, user.id);

    const account = await request(`${prefix}/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    assert.equal(account.status, 200);
    const profile = (await account.json()).data;
    assert.equal(profile.id, user.id);
    assert.equal(profile.email, user.email);
    assert.equal(profile.name, null);
    assert.equal(profile.email_verified, false);
    assert.ok(profile.created_at);
    assert.equal('hashed_password' in profile, false);
  }
});

test('card and QR log routes remain reachable after authentication', async () => {
  const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}` };
  const cards = await request('/cards', { headers });
  assert.equal(cards.status, 200);
  assert.equal((await cards.json()).success, true);

  const logs = await request('/exchanges/qr-logs', { headers });
  assert.equal(logs.status, 200);
  assert.deepEqual((await logs.json()).data, { logs: [], total: 0, newLogs: 0 });

  const exchange = await request('/exchanges/unknown-id', { headers });
  assert.equal(exchange.status, 404);
  assert.deepEqual(await exchange.json(), { success: false, error: 'Exchange record not found' });
});

test('account deletion through /users/me is reflected under /auth/me', async () => {
  const id = 'removable-user';
  const email = 'removable@example.com';
  const db = await worker.getD1Database('DB');
  await db.prepare('INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)')
    .bind(id, email, bcrypt.hashSync(user.password, 4))
    .run();
  const token = jwt.sign({ userId: id, email }, secret, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}` };

  const deletion = await request('/users/me', { method: 'DELETE', headers });
  assert.equal(deletion.status, 200);
  assert.deepEqual(await deletion.json(), { success: true, message: 'Account deleted successfully' });

  const missing = await request('/auth/me', { headers });
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { success: false, error: 'User not found' });
});
