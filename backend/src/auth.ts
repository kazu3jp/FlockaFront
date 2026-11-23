import bcrypt from 'bcryptjs';
import { betterAuth } from 'better-auth';
import { verifyPassword } from 'better-auth/crypto';
import { bearer } from 'better-auth/plugins/bearer';
import { sendAuthEmail } from './utils/email';

export const authBasePath = '/api/auth';

export function createAuth(env: WorkerBindings, ctx: Pick<ExecutionContext, 'waitUntil'>) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
  }
  if (!env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is required');

  return betterAuth({
    appName: 'Flocka',
    basePath: authBasePath,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: (env.AUTH_TRUSTED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
    database: env.DB,
    user: {
      modelName: 'users',
      fields: { emailVerified: 'email_verified', createdAt: 'created_at', updatedAt: 'updated_at' },
    },
    account: { modelName: 'auth_accounts' },
    session: {
      modelName: 'auth_sessions',
      disableSessionRefresh: true,
    },
    verification: { modelName: 'auth_verifications' },
    rateLimit: { enabled: env.ENVIRONMENT === 'production', storage: 'database', modelName: 'auth_rate_limits' },
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      backgroundTasks: { handler: (promise) => ctx.waitUntil(promise) },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      password: {
        // Migrated users retain their passwords. New and reset passwords use Better Auth's default.
        verify: (input) => /^\$2[aby]\$/.test(input.hash)
          ? bcrypt.compare(input.password, input.hash)
          : verifyPassword(input),
      },
      sendResetPassword: ({ user, url }) =>
        sendAuthEmail(env, user.email, 'Flocka - パスワードの再設定', `パスワードを再設定するには次のリンクを開いてください。\n${url}`),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: ({ user, url }) =>
        sendAuthEmail(env, user.email, 'Flocka - メールアドレスの確認', `メールアドレスを確認するには次のリンクを開いてください。\n${url}`),
    },
    plugins: [bearer({ requireSignature: true })],
  });
}
