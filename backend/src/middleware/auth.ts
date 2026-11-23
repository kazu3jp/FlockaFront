import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types';
import { createAuth } from '../auth';

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authorization header is missing or invalid',
    }, 401);
  }

  const session = await createAuth(c.env, c.executionCtx).api.getSession({
    headers: new Headers({ Authorization: authorization }),
  });
  if (!session) {
    return c.json({
      success: false,
      error: 'Invalid or expired token',
    }, 401);
  }

  c.set('user', { userId: session.user.id });
  return next();
});

export function getCurrentUser(c: Context<HonoEnv>) {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}
