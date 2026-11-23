import { Hono } from 'hono';
import { authMiddleware, getCurrentUser } from '../../middleware/auth';
import type { HonoEnv } from '../../types';

const account = new Hono<HonoEnv>();

interface AccountRow {
  id: string;
  email: string;
  name: string | null;
  email_verified: number;
  created_at: string;
}

account.get('/me', authMiddleware, async (c) => {
  try {
    const { userId } = getCurrentUser(c);
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, email_verified, created_at FROM users WHERE id = ?'
    ).bind(userId).first<AccountRow>();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: { ...user, email_verified: Boolean(user.email_verified) },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ success: false, error: 'Failed to get user information' }, 500);
  }
});

account.delete('/me', authMiddleware, async (c) => {
  try {
    const { userId } = getCurrentUser(c);
    const result = await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ success: false, error: 'Failed to delete account' }, 500);
  }
});

export default account;
