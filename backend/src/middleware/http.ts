import { createMiddleware } from 'hono/factory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 既存クライアントとの互換性のため、プリフライトは 200 と JSON を返す。
export const corsMiddleware = createMiddleware(async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return c.json({}, 200, {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400',
    });
  }

  await next();

  for (const [name, value] of Object.entries(corsHeaders)) {
    c.res.headers.set(name, value);
  }
  return c.res;
});

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();

  console.log({
    message: 'API request',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - start,
  });
});
