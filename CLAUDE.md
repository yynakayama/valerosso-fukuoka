# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

福岡県筑後地区の中学生向けサッカークラブ「ヴァレロッソ福岡」の公式サイト。Express + MySQL(Sequelize) の単一サーバーで、公開サイト（静的HTML）と管理画面（EJS）を配信する。本番は Railway にデプロイ。

## コマンド

```bash
docker-compose up -d            # 開発環境起動（app: localhost:3000 / MySQL: localhost:3307）
docker-compose logs -f app      # アプリのログ
docker-compose down             # 停止

npm run dev                     # ローカルで nodemon 起動（DB は docker の 3307 を使う）
npm run migrate                 # マイグレーション適用
npm run migrate:status          # 適用状況の確認
npx sequelize-cli migration:generate --name <name>   # 新規マイグレーション
```

- テスト・Linter・Formatter は未導入（`npm test` は常に失敗する）。JS の構文確認は `node --check <file>`。
- 管理画面: http://localhost:3000/admin/panel （開発用初期管理者 `admin` / `admin123`、`INITIAL_ADMIN_PASSWORD` で上書き可）

## アーキテクチャ

### 2種類のフロントエンド

- **公開サイト（`public/`）**: 素の HTML/CSS/JS。テンプレートエンジンは使わない。
  - ヘッダー/フッターは `public/header.html` / `footer.html` を `js/common-loader.js` が fetch して各ページの空の `<header></header>` / `<footer></footer>` に差し込む。ナビのハイライトやハンバーガーメニューの初期化もここ。ナビ変更は `header.html` 1か所で済む。
  - ページ別の CSS/JS は `css/pages/<page>.css` / `js/pages/<page>.js`。共通処理は `js/utils/common-utils.js`（`window.commonUtils`）。
  - お知らせは `js/pages/news.js` / `home.js` が `/api/news` を叩いて描画。記事の `instagram_embed_code` は `js/utils/instagram-manager.js` で Instagram 埋め込みとして表示。
  - 拡張子なし URL（`/team` 等）は `routes/public.js` の `serveStaticPage` が `public/<name>.html` を返す。新ページ追加時はここにルートを追加し、`public/sitemap.xml` も更新する。
- **管理画面（`views/admin/*.ejs` + `routes/admin.js`）**: サーバーサイドレンダリング。ニュース・お問い合わせ・ユーザー管理。PWA 用の manifest / service worker / install スクリプトも `routes/admin.js` 内で動的生成している。

### server.js の起動順序とミドルウェア

DB 接続確認（最大10回リトライ）→ config/route の require → Express 構築。ミドルウェア順は
`cors → json/urlencoded → cookieParser → express.static('public') → securityHeaders/requestLogger (config/security.js) → session (config/session.js) → userInfo → /api → /admin → /`。

- `express.static` がルーターより前にあるため、`public/sitemap.xml` と `public/robots.txt` の実ファイルが優先され、`routes/public.js` 内の動的 sitemap/robots 生成は実質使われていない。
- `routes/public.js` 末尾の `router.use('*')` が 404 を処理する（HTML リクエストには index.html を 404 で返す）。server.js 側の 404 ハンドラには通常到達しない。

### 認証・CSRF

- セッションは express-session + express-mysql-session（`sessions` テーブルを自動作成）。認証状態は `req.session.userId` のみで判定。
- `middleware/auth.js` に似た役割のミドルウェアが複数ある（`requireAuth`/`requireAdmin` は HTML 向けリダイレクト/テキスト、`requireAuthAPI`/`requireAdminAPI`/`isAdmin` は JSON 応答）。ロールは `admin` / `editor`。
- CSRF は `csurf`（cookie モード）をルート単位で付与。公開のお問い合わせ送信 `POST /api/inquiries` は CSRF なし・独自レート制限あり。

### DB と環境変数

- `config/config.js`（Sequelize）と `config/session.js`（セッションストア）の両方で DB 接続設定を持つ。接続先を変えるときは両方を直す。
  - 開発: `DB_HOST` / `DB_PORT`(既定 3307) / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
  - 本番(Railway): `MYSQLHOST` / `MYSQLPORT` / `MYSQLUSER` / `MYSQLPASSWORD` / `MYSQL_DATABASE`（SSL 必須）、`SESSION_SECRET`
- タイムゾーンは `+09:00` 固定。
- スキーマ変更は必ず `migrations/` に新しいマイグレーションを追加する（既存ファイルは本番適用済みのため編集しない）。初期データ（admin ユーザー・初期記事）も seeder ではなくマイグレーション `20250427130000-seed-initial-data.js` で投入している（`seeders/` は未使用）。

### デプロイ

- Railway（nixpacks）で `npm ci` → `npm run start`。`start` は `migrate && node server.js` のため、**master への push でマイグレーションが本番に自動適用される**。さらに `NODE_ENV=production` では server.js 起動後にもバックグラウンドで migrate が走る。
- `.gitlab-ci.yml`（GitLab Pages 用）も残っているが、現在の origin は GitHub。
