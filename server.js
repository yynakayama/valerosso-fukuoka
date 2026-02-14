// server.js - メインサーバーファイル（詳細デバッグ版）
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// マイグレーション実行関数（タイムアウト付き）
const runMigrations = async () => {
  if (process.env.NODE_ENV === 'production') {
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
        timeout: 30000
      });
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('Nothing to migrate')) {
        console.warn(stderr);
      }
    } catch (error) {
      console.error('Migration error:', error.message);
      if (error.code === 'ETIMEDOUT') {
        console.log('Migration timeout. Continuing startup.');
      }
    }
  }
};

// データベース接続テスト（リトライ付き）
const testDatabaseConnection = async (maxRetries = 10, intervalMs = 5000) => {
  const { Sequelize } = require('sequelize');
  const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sequelize = new Sequelize(config.database, config.username, config.password, config);
      await sequelize.authenticate();
      await sequelize.close();
      console.log(`DB接続成功 (試行 ${attempt}/${maxRetries})`);
      return true;
    } catch (error) {
      console.error(`DB接続失敗 (試行 ${attempt}/${maxRetries}): ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`${intervalMs / 1000}秒後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
  }
  return false;
};

// メイン起動関数
const startServer = async () => {
  try {
    // 1. データベース接続確認（最大10回、5秒間隔でリトライ）
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('DB接続失敗。全リトライ失敗のため起動中止。');
      process.exit(1);
    }

    // 2. サーバー起動
    let sessionConfig, securityMiddleware;
    try {
      sessionConfig = require('./config/session');
    } catch (error) {
      // セッション設定読み込み失敗時のみエラー出力
      console.error('セッション設定読み込み失敗:', error.message);
      process.exit(1);
    }
    try {
      securityMiddleware = require('./config/security');
    } catch (error) {
      // セキュリティ設定読み込み失敗時のみエラー出力
      console.error('セキュリティ設定読み込み失敗:', error.message);
      process.exit(1);
    }

    let apiRoutes, adminRoutes, publicRoutes;
    try {
      apiRoutes = require('./routes/api');
    } catch (error) {
      // APIルーター読み込み失敗時のみエラー出力
      console.error('APIルーター読み込み失敗:', error.message);
      process.exit(1);
    }
    try {
      adminRoutes = require('./routes/admin');
    } catch (error) {
      // 管理画面ルーター読み込み失敗時のみエラー出力
      console.error('管理画面ルーター読み込み失敗:', error.message);
      process.exit(1);
    }
    try {
      publicRoutes = require('./routes/public');
    } catch (error) {
      // 公開ページルーター読み込み失敗時のみエラー出力
      console.error('公開ページルーター読み込み失敗:', error.message);
      process.exit(1);
    }

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.get('/favicon.ico', (req, res) => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年キャッシュ
      res.sendFile(path.join(__dirname, 'public/img/favicon.png'));
    });

    app.use(express.static('public', { 
      maxAge: '30m',  // 30分キャッシュ
      etag: true      // ETag有効化
    }));

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    const { securityHeaders, requestLogger, userInfo } = securityMiddleware;
    app.use(securityHeaders);
    app.use(requestLogger);

    app.use(sessionConfig);
    app.use(userInfo);

    app.get('/debug', (req, res) => {
      res.json({ message: 'debug ok' });
    });

    app.use('/api', apiRoutes);
    app.use('/admin', adminRoutes);
    app.use('/', publicRoutes);

    app.use((err, req, res, next) => {
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('不正なリクエストです');
      }
      res.status(500).send('サーバー内部エラー');
    });

    app.use((req, res) => {
      res.status(404).send('ページが見つかりません');
    });

    // サーバー終了シグナル（SIGTERM）受信時の処理
    process.on('SIGTERM', () => {
      console.log('SIGTERM受信: サーバーを安全にシャットダウンします');
      process.exit(0);
    });

    // サーバー終了シグナル（Ctrl+C等/SIGINT）受信時の処理
    process.on('SIGINT', () => {
      console.log('SIGINT受信: サーバーを安全にシャットダウンします');
      process.exit(0);
    });

    // サーバー起動
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`サーバー起動: ポート${PORT} (${process.env.NODE_ENV || 'development'})`);
      runMigrations().catch(error => {
        console.error('バックグラウンドマイグレーションエラー:', error);
      });
    });

  } catch (error) {
    // サーバー起動時のエラー処理
    console.error('サーバー起動時にエラーが発生しました:', error);
    process.exit(1);
  }
};

// サーバー起動
startServer();