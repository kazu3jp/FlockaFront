import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { html } from 'hono/html';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { authBasePath, createAuth } from '../../auth';
import type { HonoEnv } from '../../types';
import accountRoutes from './account';

const auth = new Hono<HonoEnv>();
auth.route('/', accountRoutes);
auth.use('*', bodyLimit({ maxSize: 16 * 1024 }));

type AuthBody = Record<string, unknown>;

// Expoの既存API形式は残し、認証処理自体はBetter Authのハンドラーに委譲する。
function handle(c: Context<HonoEnv>, path: string, body?: AuthBody) {
  const url = new URL(`${authBasePath}${path}`, c.env.BETTER_AUTH_URL);
  const headers = new Headers(c.req.raw.headers);
  headers.delete('cookie');
  headers.delete('content-length');
  headers.set('content-type', 'application/json');
  return createAuth(c.env, c.executionCtx).handler(new Request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  }));
}

async function readBody(c: Context<HonoEnv>): Promise<AuthBody | null> {
  try {
    const input: unknown = await c.req.json();
    return input !== null && typeof input === 'object' && !Array.isArray(input)
      ? input as AuthBody : null;
  } catch {
    return null;
  }
}

async function formatResponse(c: Context<HonoEnv>, response: Response) {
  if (response.ok) return c.json({ success: true });
  const result = await response.json<{ message?: string }>().catch(() => null);
  const retryAfter = response.headers.get('retry-after') ?? response.headers.get('x-retry-after');
  return c.json({ success: false, error: result?.message ?? 'Authentication request failed' }, {
    status: response.status as ContentfulStatusCode,
    headers: retryAfter ? { 'Retry-After': retryAfter } : {},
  });
}

auth.post('/register', async (c) => {
  const input = await readBody(c);
  if (!input) return c.json({ success: false, error: 'Invalid request' }, 400);
  const response = await handle(c, '/sign-up/email', {
    email: input.email,
    password: input.password,
    name: input.name ?? '',
    callbackURL: '/auth/verified',
  });
  if (response.ok) return c.json({ success: true }, 201);
  return formatResponse(c, response);
});

auth.post('/login', async (c) => {
  const input = await readBody(c);
  if (!input) return c.json({ success: false, error: 'Invalid request' }, 400);
  const response = await handle(c, '/sign-in/email', { email: input.email, password: input.password });
  if (!response.ok) return formatResponse(c, response);

  const token = response.headers.get('set-auth-token');
  const { user } = await response.json<{
    user: { id: string; email: string; name: string; emailVerified: boolean };
  }>();
  if (!token) throw new Error('Better Auth did not return a bearer token');
  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, email_verified: user.emailVerified },
    },
  });
});

auth.post('/logout', async (c) => formatResponse(c, await handle(c, '/sign-out')));

auth.post('/resend-verification-by-email', async (c) => {
  const input = await readBody(c);
  if (!input) return c.json({ success: false, error: 'Invalid request' }, 400);
  return formatResponse(c, await handle(c, '/send-verification-email', {
    email: input.email,
    callbackURL: '/auth/verified',
  }));
});

auth.post('/forgot-password', async (c) => {
  const input = await readBody(c);
  if (!input) return c.json({ success: false, error: 'Invalid request' }, 400);
  return formatResponse(c, await handle(c, '/request-password-reset', {
    email: input.email,
    redirectTo: '/auth/reset-password',
  }));
});

function page(title: string, content: ReturnType<typeof html>) {
  return html`<!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title} | Flocka</title>
      </head>
      <body><main><h1>${title}</h1>${content}</main></body>
    </html>`;
}

auth.get('/verified', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.html(c.req.query('error')
    ? page('メールを確認できませんでした', html`<p>アプリから認証メールを再送してください。</p>`)
    : page('メール認証が完了しました', html`<p><a href="flockaapp:///sign-in">Flockaでログイン</a></p>`));
});

auth.get('/reset-password', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Referrer-Policy', 'no-referrer');
  const token = c.req.query('token');
  if (!token) return c.html(page('リンクが無効です', html`<p>アプリから再設定メールを再送してください。</p>`), 400);
  return c.html(page('パスワードの再設定', html`
    <form action="/auth/reset-password" method="post">
      <input type="hidden" name="token" value="${token}">
      <p><label for="new-password">新しいパスワード（8文字以上）</label></p>
      <p><input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></p>
      <button type="submit">パスワードを変更</button>
    </form>`));
});

auth.post('/reset-password', async (c) => {
  const form = c.req.header('content-type')?.startsWith('application/x-www-form-urlencoded');
  const input = form ? await c.req.parseBody() : await readBody(c);
  if (!input) return c.json({ success: false, error: 'Invalid request' }, 400);
  const response = await handle(c, '/reset-password', { token: input.token, newPassword: input.newPassword });
  if (!form) return formatResponse(c, response);

  c.header('Cache-Control', 'no-store');
  return response.ok
    ? c.html(page('パスワードを変更しました', html`<p><a href="flockaapp:///sign-in">Flockaでログイン</a></p>`))
    : c.html(page('パスワードを変更できませんでした', html`<p>アプリから新しい再設定リンクを取得してください。</p>`), 400);
});

export default auth;
