# Flocka API

Flocka API は、プロフィールカードの作成・共有・交換を行うバックエンドAPIです。Cloudflare Workers と D1 を活用し、ユーザー認証、カード管理、QRコードを用いた即時交換、交換履歴の管理などの機能を提供します。

![Flocka App Screenshot](img/Flocka.jpg)

## 主な機能

- プロフィールカードの作成・管理（画像アップロード、カード名、最大80文字のbio、リンク）
- QRコードを用いた即時双方向交換（生成・読み取り・交換ログ）
- 交換履歴（コレクション）とメモ／位置情報の管理
- パスワードリセット（トークン発行・検証・リセットフォーム）

## 技術スタック

- API: Cloudflare Workers（Hono）
- 認証: Better Auth（メール・パスワード、Bearerセッション）
- データベース: Cloudflare D1（SQLite。アプリデータと認証データを保存）
- ストレージ: Cloudflare R2（画像ファイル）
- メール配信: MailChannels API
- 言語: TypeScript

## API エンドポイント（概要）

認証（`/auth`）
- `POST /register` — 新規登録
- `POST /login` — ログイン
- `POST /logout` — セッションを無効化
- `POST /resend-verification-by-email` — 認証メール再送
- `POST /forgot-password` — パスワードリセット申請
- `POST /reset-password` — パスワードリセット実行
- `GET /reset-password` — パスワードリセット用フォーム
- `GET /me` — 現在のユーザー情報取得
- `DELETE /me` — アカウント削除

`/auth` はExpoクライアントの既存形式を維持するためのルートです。認証は `/api/auth/*` にマウントした Better Auth が処理します。

カード管理（`/cards`）
- `POST /upload-url` — 旧クライアント向けのアップロード情報（署名付きURLではありません）
- `POST /upload` — Worker経由でR2に画像をアップロード
- `GET /image/*` — R2のカード画像を取得
- `POST /` — カード作成
- `GET /` — 所有カード一覧取得
- `GET /:id` — カード詳細取得
- `PUT /:id` — カード更新
- `DELETE /:id` — カード削除
- `POST /:id/generate-exchange-url` — 交換用URL生成

交換・コレクション（`/exchanges`）
- `POST /qr/generate` — QRデータ生成
- `POST /qr` — QR読み取りによる即時交換処理
- `GET /qr-logs` — QR交換ログ取得
- `DELETE /qr/logs/:id` — QR交換ログ削除
- `GET /` — コレクション一覧取得
- `POST /` — 手動でのカード追加
- `GET /:id` — 交換詳細取得
- `PUT /:id` — メモ・位置情報更新
- `DELETE /:id` — 交換記録削除

公開・共有
- `GET /cards/exchange` — 交換用URL経由でカード取得
- `GET /cards/public/:id` — 公開カード表示

## QR 即時交換の基本フロー

1. QR を生成: `POST /exchanges/qr/generate`（カードIDを指定）
2. QR を読み取り交換実行: `POST /exchanges/qr`（QRデータと自分のカードIDを送信）
3. 交換結果とログを返却し、必要に応じて `qr_exchange_logs` に記録します。

エラー時はエラー種別とトラッキング用IDを返すことを想定しています（例: 重複交換、外部キーエラー、一般データベースエラーなど）。

## パスワードリセット

- リセット申請: `POST /auth/forgot-password`（登録済みメールを指定）
- リセット実行: `POST /auth/reset-password`（メールのトークンと新パスワードを送信）
- ブラウザ向けフォーム: `GET /auth/reset-password?token=...`

仕様の要点:
- トークンはBetter Authが発行・検証し、再利用できません。
- パスワードを変更すると既存のセッションが失効します。

## データベース（概要）

アプリデータは `users`、`cards`、`exchanges`、`qr_exchange_logs` などに格納します。Better Auth は `auth_accounts`、`auth_sessions`、`auth_verifications`、`auth_rate_limits` を使います。スキーマは [`db/migrations/`](db/migrations/) で管理します。

## 開発・デプロイ

`src/index.ts` はWorkerの入口、`src/app.ts` はHonoアプリの組み立てを担います。共通のHTTP処理と認証処理は `src/middleware/`、機能別のルートは `src/routes/` にあります。アカウント情報の取得・削除は `/auth/me` と `/users/me` の両方で利用できます。

ローカル開発のコマンドは `backend/` で実行します。

```bash
npm ci
cp .dev.vars.example .dev.vars
# 生成した値を .dev.vars の BETTER_AUTH_SECRET に設定
openssl rand -hex 32
npm run db:init
npm run dev
```

メール送信を確認する場合は `.dev.vars` に `MAILCHANNELS_API_KEY` を設定します。メールの認証・再設定リンクは `BETTER_AUTH_URL` を使うため、実機など別端末でリンクを開く場合は `wrangler.local.jsonc` の値を端末から到達できるURLに変更してください。Expo Webを別のオリジンで使う場合は、そのオリジンを `AUTH_TRUSTED_ORIGINS` に追加します。

```bash
npm run type-check
npm test
```

`npm test` はWorkerをドライランでビルドし、Miniflareの一時D1を使ってAPIを検証します。本番リソースやメール配信サービスには接続しません。`wrangler.local.jsonc` または `.dev.vars.example` のバインディングを変更したら、`npm run types:generate` で型を再生成してください。

本番では既存の `DB`・`R2` バインディングに加え、`ENVIRONMENT=production`、公開HTTPSの `BETTER_AUTH_URL`、必要に応じて `AUTH_TRUSTED_ORIGINS` を設定します。`BETTER_AUTH_SECRET` と `MAILCHANNELS_API_KEY` は Workers のシークレットに登録します。

既存環境を切り替える場合は、D1をバックアップして検証環境でマイグレーションを確認してから、旧Workerへの書き込みを止めます。本番設定でD1の `migrations_dir` を `db/migrations` に指定し、`npx wrangler d1 migrations apply DB --remote --config wrangler.toml` を実行してから `npm run deploy` で新Workerに切り替えます。この移行は旧Workerとの同時稼働には対応しません。

既存のユーザーID、パスワード、カード、R2の画像キーは保持されます。メールアドレスは小文字に統一され、大文字・小文字だけが異なる重複がある場合は移行が中断します。旧JWTと旧認証・再設定リンクは移行後に無効になるため、ログインし直し、必要ならメールを再発行してください。
