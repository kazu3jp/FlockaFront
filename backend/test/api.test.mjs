import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';
import { unstable_readConfig, unstable_splitSqlQuery } from 'wrangler';

const config = unstable_readConfig({
  config: fileURLToPath(new URL('../wrangler.local.jsonc', import.meta.url)),
});
const user = { id: 'legacy-user', email: 'legacy@example.com', password: 'test-password' };
const baseUrl = config.vars.BETTER_AUTH_URL;
const sender = 'Flocka <auth@example.com>';
const worker = new Miniflare(convertV4MiniflareOptions({
  cf: false,
  modules: true,
  scriptPath: fileURLToPath(new URL('../dist/index.js', import.meta.url)),
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
  bindings: {
    ...config.vars,
    ENVIRONMENT: 'production',
    BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
    RESEND_API_KEY: 'test-key',
    RESEND_FROM_EMAIL: sender,
  },
  d1Databases: ['DB'],
  r2Buckets: ['R2'],
  outboundService: async (request) => {
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.get('Authorization'), 'Bearer test-key');
    const mail = await request.json();
    assert.equal(mail.from, sender);
    pendingMail.get(mail.to[0])?.(mail);
    return Response.json({ id: 'test-email-id' });
  },
}));

const pendingMail = new Map();

function captureMail(email) {
  return new Promise((resolve) => pendingMail.set(email, resolve))
    .finally(() => pendingMail.delete(email));
}

function request(path, options) {
  return worker.dispatchFetch(new URL(path, baseUrl), { redirect: 'manual', ...options });
}

function post(path, body, headers = {}) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl, ...headers },
    body: JSON.stringify(body),
  });
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

async function login(email, password, prefix = '/auth') {
  const response = await post(`${prefix}/login`, { email, password });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return body.data;
}

async function applyMigration(db, name) {
  const sql = await readFile(new URL(`../db/migrations/${name}`, import.meta.url), 'utf8');
  await db.batch(unstable_splitSqlQuery(sql).map((query) => db.prepare(query)));
}

before(async () => {
  const db = await worker.getD1Database('DB');
  await applyMigration(db, '0001_legacy_schema.sql');
  await db.prepare('INSERT INTO users (id, email, hashed_password, email_verified) VALUES (?, ?, ?, 1)')
    .bind(user.id, user.email.toUpperCase(), bcrypt.hashSync(user.password, 4)).run();
  await db.prepare('INSERT INTO cards (id, user_id, card_name, image_key) VALUES (?, ?, ?, ?)')
    .bind('legacy-card', user.id, 'Legacy card', 'cards/legacy-user/image.png').run();
  await db.prepare('INSERT INTO exchanges (id, owner_user_id, collected_card_id) VALUES (?, ?, ?)')
    .bind('legacy-exchange', user.id, 'legacy-card').run();
  await applyMigration(db, '0002_better_auth.sql');
  const r2 = await worker.getR2Bucket('R2');
  await r2.put('cards/legacy-user/image.png', 'legacy image data', { httpMetadata: { contentType: 'image/png' } });
});

after(() => worker.dispose());

beforeEach(async () => {
  const db = await worker.getD1Database('DB');
  await db.prepare('DELETE FROM auth_rate_limits').run();
});

test('health, not found, and CORS preflight keep the existing response', async () => {
  const health = await request('/');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('access-control-allow-origin'), '*');
  assert.equal((await health.json()).success, true);

  const missing = await request('/not-a-route');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('access-control-allow-origin'), '*');

  const preflight = await request('/users/me', { method: 'OPTIONS' });
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(await preflight.json(), {});
});

test('migration retains the legacy password, user ID, card and R2 image', async () => {
  const session = await login(user.email, user.password, '/users');
  assert.equal(session.user.id, user.id);
  const headers = authorization(session.token);
  for (const route of ['/auth/me', '/users/me']) {
    const profile = await request(route, { headers });
    assert.equal(profile.status, 200);
    const { data } = await profile.json();
    assert.equal(data.id, user.id);
    assert.equal(data.email_verified, true);
    assert.equal('hashed_password' in data, false);
  }
  const cards = await request('/cards', { headers });
  assert.equal(cards.status, 200);
  assert.equal((await cards.json()).data[0].id, 'legacy-card');
  const image = await request('/cards/image/cards/legacy-user/image.png');
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal(await image.text(), 'legacy image data');
  const exchange = await request('/exchanges/legacy-exchange', { headers });
  assert.equal(exchange.status, 200);
  const { data } = await exchange.json();
  assert.equal(new URL(data.card.image_url).pathname, '/cards/image/cards/legacy-user/image.png');
  const logs = await request('/exchanges/qr-logs', { headers });
  assert.equal(logs.status, 200);
  assert.deepEqual((await logs.json()).data, { logs: [], total: 0, newLogs: 0 });
  assert.equal((await request('/exchanges/unknown-id', { headers })).status, 404);
});

test('card image uploads use the same R2 binding as downloads', async () => {
  const { token } = await login(user.email, user.password);
  const form = new FormData();
  form.set('file', new File(['uploaded bytes'], 'card.PNG', { type: 'image/png' }));
  const multipart = new Response(form);
  const upload = await request('/cards/upload', {
    method: 'POST',
    body: await multipart.arrayBuffer(),
    headers: { ...authorization(token), 'Content-Type': multipart.headers.get('content-type') },
  });
  assert.equal(upload.status, 201);
  const { data } = await upload.json();
  assert.match(data.fileKey, /^cards\/legacy-user\/.+\.png$/);

  const image = await request(`/cards/image/${data.fileKey}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal(await image.text(), 'uploaded bytes');
});

test('only valid sessions are accepted and logout invalidates the session', async () => {
  const missing = await request('/auth/me');
  assert.equal(missing.status, 401);
  assert.equal((await request('/auth/me', { headers: authorization('invalid') })).status, 401);
  assert.equal((await post('/auth/login', { email: user.email, password: user.password }, {
    Origin: 'https://untrusted.example',
  })).status, 403);

  const { token } = await login(user.email, user.password);
  const headers = authorization(token);
  assert.equal((await post('/auth/logout', {}, headers)).status, 200);
  assert.equal((await request('/auth/me', { headers })).status, 401);
});

test('production rate limits persist across auth requests in D1', async () => {
  const headers = { 'CF-Connecting-IP': '192.0.2.10' };
  let response;
  for (let i = 0; i < 15; i++) {
    response = await post('/auth/login', { email: user.email, password: 'incorrect' }, headers);
    if (response.status === 429) break;
    assert.equal(response.status, 401);
  }
  assert.equal(response?.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});

test('sign-up, verification email, password reset and account deletion', { timeout: 15000 }, async () => {
  const email = 'new@example.com';
  const password = 'new-account-password';
  const verificationMail = captureMail(email);
  const registration = await post('/auth/register', { email, name: null, password });
  assert.equal(registration.status, 201, await registration.text());
  const confirmationUrl = (await verificationMail).text.split('\n').at(-1);
  assert.equal(new URL(confirmationUrl).origin, baseUrl);
  const verified = await request(confirmationUrl);
  assert.equal(verified.status, 302);
  assert.equal(new URL(verified.headers.get('location'), baseUrl).pathname, '/auth/verified');
  assert.equal(new URL(verified.headers.get('location'), baseUrl).search, '');

  const session = await login(email, password);
  assert.equal(session.user.email_verified, true);
  const resetMail = captureMail(email);
  const resetRequest = await post('/auth/forgot-password', { email });
  assert.equal(resetRequest.status, 200);
  const resetUrl = (await resetMail).text.split('\n').at(-1);
  assert.equal(new URL(resetUrl).origin, baseUrl);
  const redirect = await request(resetUrl);
  assert.equal(redirect.status, 302);
  const resetPage = new URL(redirect.headers.get('location'), baseUrl);
  const token = resetPage.searchParams.get('token');
  assert.ok(token);
  const form = await request(resetPage);
  assert.equal(form.status, 200);
  assert.match(await form.text(), /autocomplete="new-password"/);

  const newPassword = 'reset-account-password';
  const reset = await request('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: baseUrl },
    body: new URLSearchParams({ token, newPassword }),
  });
  assert.equal(reset.status, 200, await reset.text());
  assert.equal((await post('/auth/reset-password', { token, newPassword })).status, 400);
  assert.equal((await request('/auth/me', { headers: authorization(session.token) })).status, 401);
  assert.equal((await post('/auth/login', { email, password })).status, 401);

  const signedInAgain = await login(email, newPassword);
  const headers = authorization(signedInAgain.token);
  assert.equal((await request('/users/me', { method: 'DELETE', headers })).status, 200);
  assert.equal((await request('/auth/me', { headers })).status, 401);
  const db = await worker.getD1Database('DB');
  assert.equal(await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first(), null);
});
