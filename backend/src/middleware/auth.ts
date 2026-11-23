import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../types';
import { verifyJWT } from '../utils/auth';

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authorization header is missing or invalid',
    }, 401);
  }

  const payload = verifyJWT(authorization.slice(7), c.env.JWT_SECRET);
  if (!payload) {
    return c.json({
      success: false,
      error: 'Invalid or expired token',
    }, 401);
  }

  c.set('user', payload);
  return next();
});

export function getCurrentUser(c: Context<HonoEnv>) {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}
