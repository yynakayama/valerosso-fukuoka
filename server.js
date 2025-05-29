// server.js - メインサーバーファイル（分割後）
const express = require('express'); // Expressフレームワークのインポート
const cors = require('cors');       // CORSミドルウェアのインポート
const path = require('path');       // パス操作用ユーティリティ
const cookieParser = require('cookie-parser'); // Cookieの解析
require('dotenv').config();         // 環境変数の読み込み

// 設定ファイルとミドルウェアのインポート
const sessionConfig = require('./config/session');     // セッション設定
const { securityHeaders, requestLogger, userInfo } = require('./config/security');   // セキュリティ設定

// ルーターのインポート
const apiRoutes = require('./routes/api');       // API関連のルート
const adminRoutes = require('./routes/admin');   // 管理画面関連のルート
const publicRoutes = require('./routes/public'); // 公開ページ関連のルート

// Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3000; // 環境変数からポート番号を取得、なければ3000を使用

// 基本ミドルウェアの設定
app.use(cors());                // クロスオリジンリクエストを許可
app.use(express.json());        // JSONリクエストボディの解析
app.use(express.urlencoded({ extended: false })); // フォームデータの解析
app.use(cookieParser());        // Cookieの解析
app.use(express.static('public')); // 静的ファイルの提供（HTMLやCSS、画像など）

// EJSをビューエンジンとして設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// セキュリティとログの設定
app.use(securityHeaders);       // セキュリティヘッダーの適用
app.use(requestLogger);         // リクエストログの記録

// セッション設定の適用
app.use(sessionConfig);

// ユーザー情報設定の適用
app.use(userInfo);

// ルーティングの設定
app.use('/api', apiRoutes);        // /api/* のルートをapiRoutesに委譲
app.use('/admin', adminRoutes);    // /admin/* のルートをadminRoutesに委譲
app.use('/', publicRoutes);        // その他のルートをpublicRoutesに委譲

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // CSRF エラーの場合
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('不正なリクエストです');
  }
  
  // その他のエラー
  res.status(500).send('サーバー内部エラーが発生しました');
});

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`管理画面: http://localhost:${PORT}/admin/login`);
});

module.exports = app; // テスト用にエクスポート