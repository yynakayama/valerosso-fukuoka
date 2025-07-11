# Valerosso Fukuoka - サッカークラブウェブサイト

## プロジェクト概要
福岡県筑後地方を拠点に活動する中学生・高校生向けサッカークラブ「Valerosso Fukuoka」の公式ウェブサイトです。技術向上と人間的成長を大切にするクラブの理念を反映したサイト構築を目指しています。

## 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Node.js 18+, Express.js 4.21+
- **データベース**: MySQL 8.0, Sequelize ORM 6.37+
- **認証**: Express Session, Passport.js, bcrypt
- **セキュリティ**: CORS, CSRF Protection, Express Validator
- **開発環境**: Docker, Docker Compose
- **デプロイ**: Railway (Nixpacks対応)

## 開発環境のセットアップ

### 前提条件
- [Docker](https://www.docker.com/get-started) がインストールされていること
- [Docker Compose](https://docs.docker.com/compose/install/) がインストールされていること
- [Git](https://git-scm.com/downloads) がインストールされていること

### インストール手順

1. リポジトリをクローンする
```bash
git clone https://gitlab.com/nkym19941225/valerosso-fukuoka.git
cd valerosso-fukuoka
```

2. 環境変数ファイルを設定する
```bash
# プロダクション環境では.envファイルを作成し、適切な環境変数を設定
# 開発環境ではdocker-compose.ymlの環境変数が使用されます
```

3. Docker コンテナをビルドして起動する
```bash
docker-compose up -d
```

4. アプリケーションにアクセスする
```
http://localhost:3000
```

## プロジェクト構造
```
VALEROSSO-FUKUOKA/
├── config/             # 設定ファイル
│   ├── config.js       # データベース設定
│   ├── security.js     # セキュリティミドルウェア
│   └── session.js      # セッション設定
├── middleware/         # カスタムミドルウェア
│   └── auth.js         # 認証ミドルウェア
├── migrations/         # データベースマイグレーション
├── models/            # Sequelizeデータモデル
│   ├── index.js       # モデル初期化
│   ├── user.js        # ユーザーモデル
│   ├── news.js        # ニュースモデル
│   └── Inquiry.js     # お問い合わせモデル
├── public/            # 静的ファイル
│   ├── css/           # CSSファイル
│   │   ├── style.css  # メインスタイル
│   │   ├── header.css # ヘッダースタイル
│   │   ├── footer.css # フッタースタイル
│   │   └── pages/     # ページ別スタイル
│   ├── js/            # JavaScriptファイル
│   │   ├── pages/     # ページ別スクリプト
│   │   └── utils/     # ユーティリティ関数
│   ├── img/           # 画像ファイル
│   ├── contact.html   # お問い合わせページ
│   ├── footer.html    # フッター共通パーツ
│   ├── gallery.html   # フォトギャラリーページ
│   ├── header.html    # ヘッダー共通パーツ
│   ├── index.html     # トップページ
│   ├── join.html      # 入部案内ページ
│   ├── news.html      # お知らせページ
│   ├── team.html      # クラブ紹介ページ
│   ├── robots.txt     # 検索エンジン向け設定
│   └── sitemap.xml    # サイトマップ
├── routes/            # ルーティング
│   ├── admin.js       # 管理画面ルート
│   ├── public.js      # 公開ページルート
│   └── api/           # APIルート
│       ├── index.js   # APIメインルート
│       ├── news.js    # ニュースAPI
│       └── inquiries.js # お問い合わせAPI
├── utils/             # ユーティリティ関数
├── views/             # EJSビューテンプレート
│   └── admin/         # 管理画面テンプレート
│       ├── panel.ejs      # 管理パネル
│       ├── login.ejs      # ログイン画面
│       ├── news-form.ejs  # ニュース作成・編集
│       ├── news-list.ejs  # ニュース一覧
│       ├── inquiries.ejs  # お問い合わせ管理
│       ├── users.ejs      # ユーザー管理
│       └── user-form.ejs  # ユーザー作成・編集
├── .env               # 環境変数（プロダクション用）
├── docker-compose.yml # Docker Compose設定
├── Dockerfile         # Dockerビルド設定
├── nixpacks.toml      # Railway デプロイ設定
├── railway.json       # Railway プロジェクト設定
├── package.json       # NPMパッケージ管理
├── package-lock.json  # NPM依存関係ロック
├── README.md          # このファイル
├── SECURITY.md        # セキュリティポリシー
├── SEO_IMPROVEMENTS.md # SEO改善メモ
└── server.js          # サーバー起動スクリプト
```

## 主な機能
- **公開サイト**
  - クラブ紹介ページ
  - フォトギャラリー
  - お知らせ表示（Instagram連携対応）
  - 入団案内
  - お問い合わせフォーム（体験入団、入団申し込み、メディア取材対応）

- **管理システム**
  - 管理者認証（セッション管理）
  - ニュース投稿・編集・削除
  - お問い合わせ管理
  - ユーザー管理（管理者権限）

## APIエンドポイント
| エンドポイント | メソッド | 説明 | 認証 |
|--------------|--------|------|------|
| /api/test | GET | APIの動作確認 | 不要 |
| /api/news | GET | ニュース一覧取得 | 不要 |
| /api/news/:id | GET | 特定ニュース記事取得 | 不要 |
| /api/news | POST | ニュース投稿 | 管理者 |
| /api/news/:id | PUT | ニュース更新 | 管理者 |
| /api/news/:id | DELETE | ニュース削除 | 管理者 |
| /api/inquiries | POST | お問い合わせ送信 | 不要 |
| /api/inquiries | GET | お問い合わせ一覧取得 | 管理者 |
| /api/inquiries/:id | GET | お問い合わせ詳細取得 | 管理者 |
| /api/inquiries/:id/status | PATCH | お問い合わせステータス更新 | 管理者 |

## 開発ガイドライン
- ESLintとPrettierによるコード品質管理（今後導入予定）
- セキュリティベストプラクティスの遵守
- レスポンシブデザインの実装
- 日本語対応（タイムゾーン：Asia/Tokyo）

## 開発フェーズ
1. ✅ Docker環境構築 
2. ✅ プロジェクト初期化 
3. ✅ データベース設計・実装
4. ✅ バックエンド開発（認証、API、管理画面）
5. ✅ フロントエンド開発（公開ページ、お問い合わせフォーム）
6. ✅ Instagram API連携実装
7. ✅ デプロイ・運用開始(Railway)
8. 📋 テスト実装・最適化

## 開発メモ
- **サーバー操作**
  - 起動: `docker-compose up -d`
  - 停止: `docker-compose down`
  - ログ確認: `docker-compose logs -f app`
  - マイグレーション実行: `npm run migrate`

- **データベース接続情報**
  - ホスト: localhost
  - ポート: 3307
  - ユーザー名: valerosso_user
  - パスワード: valerosso_password
  - データベース名: valerosso

- **管理画面**
  - 管理パネル: http://localhost:3000/admin/panel
  - 初期管理者は自動作成されます（username: admin, password: admin123）
  - 本番運用前に必ずパスワードを変更してください

## セキュリティ機能
- CSRF保護
- セッション管理
- パスワードハッシュ化（bcrypt）
- 入力値検証（express-validator）
- SQLインジェクション対策（Sequelize ORM）

## コンタクト
- プロジェクト管理者: 中山 雄太郎
- Eメール: nkym19941225@gmail.com