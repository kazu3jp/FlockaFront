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
- データベース: Cloudflare D1（SQLite）
- ストレージ: Cloudflare R2（画像ファイル）
- メール配信: MailChannels API
- 言語: TypeScript

## API エンドポイント（概要）

認証（`/auth`）
- `POST /register` — 新規登録
- `POST /login` — ログイン
- `GET /verify` — メール確認
- `POST /resend-verification` — 認証メール再送（認証済みが必要な場合あり）
- `POST /forgot-password` — パスワードリセット申請
- `POST /reset-password` — パスワードリセット実行
- `GET /reset-password` — パスワードリセット用フォーム
- `GET /me` — 現在のユーザー情報取得

カード管理（`/cards`）
- `POST /upload-url` — 署名付きアップロードURL生成
- `POST /upload-file` — 直接ファイルアップロード
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
- トークンの有効期限は 1 時間（3600 秒）
- トークンはワンタイム使用（使用済みフラグで管理）
- 期限切れトークンの自動クリーンアップを行うテーブルを用意

## データベース（概要）

主なテーブル: `users`, `cards`（bio カラム含む）, `exchanges`, `qr_exchange_logs`, `qr_exchange_tokens`, `password_reset_tokens`。

例: `qr_exchange_logs` と `password_reset_tokens` はそれぞれ交換ログとパスワードリセットを管理するテーブルです（スキーマは `db/schema.sql` を参照してください）。

## 開発・デプロイ

ローカル開発のコマンドは `backend/` で実行します。

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:init
npm run dev
```

認証機能で使用する `JWT_SECRET` は `.dev.vars` に設定します。メール送信を確認する場合は `MAILCHANNELS_API_KEY` も設定します。

```bash
npm run type-check
npm run build
```

本番デプロイには、対象環境の `wrangler.toml` を `backend/` に配置してから `npm run deploy` を実行します。
