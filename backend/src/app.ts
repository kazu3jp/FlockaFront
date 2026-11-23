import { Hono } from 'hono';
import { corsMiddleware, requestLogger } from './middleware/http';
import authRoutes from './routes/auth';
import cardRoutes from './routes/cards';
import exchangeRoutes from './routes/exchanges';
import cleanupRoutes from './routes/cleanup';
import type { HonoEnv } from './types';

// Honoアプリケーションの初期化
const app = new Hono<HonoEnv>();

// グローバルミドルウェアの適用
app.use('*', corsMiddleware);
app.use('*', requestLogger);

app.onError((error, c) => {
  console.error('Unhandled error:', error);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// ルートハンドラーの設定
app.route('/auth', authRoutes);
app.route('/users', authRoutes); // 既存の /users/* エイリアスを維持
app.route('/cards', cardRoutes);
app.route('/exchanges', exchangeRoutes);
app.route('/cleanup', cleanupRoutes);

// ヘルスチェック用エンドポイント
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Flocka API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// APIバージョン情報
app.get('/api/version', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'Flocka API',
      version: '1.0.0',
      description: 'デジタルプロフィールカード交換アプリのバックエンドAPI',
      endpoints: {
        auth: [
          'POST /auth/register',
          'POST /auth/login',
          'POST /auth/verify-email',
          'GET /auth/verify',
          'GET /auth/verify-status/:userId',
          'GET /users/me',
          'DELETE /users/me',
        ],
        cards: [
          'POST /cards/upload-url',
          'POST /cards',
          'GET /cards',
          'PUT /cards/:id',
          'DELETE /cards/:id',
          'POST /cards/:id/generate-exchange-url',
          'GET /cards/exchange',
        ],
        exchanges: [
          'POST /exchanges',
          'GET /exchanges',
          'GET /exchanges/:id',
          'PUT /exchanges/:id',
          'DELETE /exchanges/:id',
          'POST /exchanges/mutual',
          'GET /exchanges/token-info',
        ],
      },
    },
  });
});

// 404ハンドラー
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  }, 404);
});

// エクスポート
export default app;
