# Valerosso Fukuoka - サッカークラブウェブサイト

## プロジェクト概要
福岡県筑後地方を拠点に活動する中学生・高校生向けサッカークラブ「Valerosso Fukuoka」の公式ウェブサイトです。技術向上と人間的成長を大切にするクラブの理念を反映したサイト構築を目指しています。

## 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript
- **バックエンド**: Node.js, Express.js
- **データベース**: MySQL, Sequelize ORM
- **開発環境**: Docker, Docker Compose

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
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
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
├── controllers/        # コントローラー
├── middleware/         # ミドルウェア
├── migrations/         # データベースマイグレーション
├── models/            # データモデル
├── mysql-init/        # MySQLデータベース初期化スクリプト
├── public/            # 静的ファイル
│   ├── css/           # CSSファイル
│   ├── img/           # 画像ファイル
│   ├── js/            # JavaScriptファイル
│   ├── admin-login.html  # 管理者ログインページ
│   ├── admin-panel.html  # 管理パネルページ
│   ├── contact.html   # お問い合わせページ
│   ├── gallery.html   # フォトギャラリーページ
│   ├── index.html     # トップページ
│   ├── join.html      # 入部案内ページ
│   ├── news.html      # お知らせページ
│   ├── schedule.html  # 練習・試合予定ページ
│   └── team.html      # クラブ紹介ページ
├── routes/            # ルーティング
├── utils/             # ユーティリティ関数
├── views/             # ビューテンプレート
├── .env               # 環境変数
├── .gitlab-ci.yml     # GitLab CI/CD設定
├── .sequelizerc       # Sequelize設定
├── docker-compose.yml # Docker Compose設定
├── Dockerfile         # Dockerビルド設定
├── package.json       # NPMパッケージ管理
├── package-lock.json  # NPM依存関係ロック
├── README.md          # このファイル
├── SECURITY.md        # セキュリティポリシー
└── server.js          # サーバー起動スクリプト
```

## 主な機能
- クラブ紹介ページ
- 練習・試合予定表示
- お知らせ機能(Instagramとの連携予定）
- フォトギャラリー
- 入部案内
- お問い合わせフォーム
- 管理者ページ（ニュース投稿・編集）

## APIエンドポイント
| エンドポイント | メソッド | 説明 |
|--------------|--------|------|
| /api/test | GET | APIの動作確認 |
| /api/news | GET | ニュース一覧取得 |
| /api/news/:id | GET | 特定ニュース記事取得 |
| /api/news | POST | ニュース投稿 |
| /api/news/:id | DELETE | ニュース削除 |

## 開発ガイドライン
- 今後プロジェクトの進行に合わせて詳細を追加予定

## 開発フェーズ
1. Docker環境構築 (完了)
2. プロジェクト初期化 (完了)
3. データベース設計 (完了)
4. バックエンド開発 (進行中)
5. フロントエンド開発 (予定)
7. テスト・デプロイ (予定)

## 開発メモ
- サーバー起動: `docker-compose up -d`
- サーバー停止: `docker-compose down`
- ログ確認: `docker-compose logs -f app`
- データベース接続情報:
  - ホスト: localhost
  - ポート: 3307
  - ユーザー名: (環境変数ファイルを参照)
  - パスワード: (環境変数ファイルを参照)
  - データベース名: (環境変数ファイルを参照)
- phpMyAdmin: http://localhost:8080

## コンタクト
- プロジェクト管理者: 中山 雄太郎
- Eメール: nkym19941225@gmail.com