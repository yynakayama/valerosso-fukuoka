// server.js - メインサーバーファイル（修正版）
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// デバッグ用：環境変数の確認
console.log('🔍 環境変数チェック:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MYSQLHOST:', process.env.MYSQLHOST ? 'SET' : 'NOT_SET');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE ? 'SET' : 'NOT_SET');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT_SET');

// マイグレーション実行関数（タイムアウト付き）
const runMigrations = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 本番環境でマイグレーションを実行中...');
    
    try {
      // タイムアウト付きでマイグレーション実行
      console.log('🚀 マイグレーションを実行中...');
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
        timeout: 30000 // 30秒でタイムアウト
      });
      
      if (stdout) console.log('📝 マイグレーション出力:', stdout);
      if (stderr && !stderr.includes('Nothing to migrate')) {
        console.warn('⚠️ マイグレーション警告:', stderr);
      }
      
      console.log('✅ マイグレーションが正常に完了しました');
      
    } catch (error) {
      console.error('❌ マイグレーション実行中にエラーが発生しました:', error.message);
      
      // タイムアウトエラーの場合は警告として扱う
      if (error.code === 'ETIMEDOUT') {
        console.log('⚠️ マイグレーションがタイムアウトしましたが、サーバーは起動を続行します');
      } else {
        console.error('詳細:', error.stdout || error.stderr);
      }
      
      console.log('📝 必要に応じて手動でマイグレーションを実行してください: npm run migrate');
    }
  } else {
    console.log('🔧 開発環境ではマイグレーションをスキップします');
  }
};

// データベース接続テスト
const testDatabaseConnection = async () => {
  try {
    const { Sequelize } = require('sequelize');
    const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];
    
    console.log('📊 データベース設定確認:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username ? 'SET' : 'NOT_SET'
    });
    
    const sequelize = new Sequelize(config.database, config.username, config.password, config);
    
    await sequelize.authenticate();
    console.log('✅ データベース接続成功');
    await sequelize.close();
    
    return true;
  } catch (error) {
    console.error('❌ データベース接続失敗:', error.message);
    return false;
  }
};

// メイン起動関数
const startServer = async () => {
  try {
    // 1. データベース接続確認
    console.log('🔌 データベース接続をテスト中...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.error('💀 データベースに接続できません。起動を中止します。');
      process.exit(1);
    }
    
    // 2. サーバー起動（マイグレーションは並行実行）
    console.log('🚀 Expressサーバーを起動中...');
    
    // 設定ファイルとミドルウェアのインポート
    const sessionConfig = require('./config/session');
    const { securityHeaders, requestLogger, userInfo } = require('./config/security');
    
    // ルーターのインポート
    const apiRoutes = require('./routes/api');
    const adminRoutes = require('./routes/admin');
    const publicRoutes = require('./routes/public');
    
    // Expressアプリケーションの初期化
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    // 基本ミドルウェアの設定
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static('public'));
    
    // EJSをビューエンジンとして設定
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    
    // セキュリティとログの設定
    app.use(securityHeaders);
    app.use(requestLogger);
    
    // セッション設定の適用
    app.use(sessionConfig);
    
    // ユーザー情報設定の適用
    app.use(userInfo);
    
    // ルーティングの設定（/health エンドポイントを削除）
    app.use('/api', apiRoutes);
    app.use('/admin', adminRoutes);
    app.use('/', publicRoutes); // public routes に /health が含まれている
    
    // エラーハンドリングミドルウェア
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('不正なリクエストです');
      }
      
      res.status(500).send('サーバー内部エラーが発生しました');
    });
    
    // 404エラーハンドリング
    app.use((req, res) => {
      res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // グレースフルシャットダウン対応
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
    
    // サーバーの起動
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
      console.log(`🚀 ヴァレロッソ福岡サーバーがポート${PORT}で起動しました！`);
      console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
      console.log('📱 管理画面: /admin/login');
      console.log('🏠 メインサイト: /');
      console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
      
      // サーバー起動後にマイグレーションを実行（ノンブロッキング）
      runMigrations().catch(error => {
        console.error('Background migration error:', error);
      });
    });
    
  } catch (error) {
    console.error('💀 サーバー起動中にエラーが発生しました:', error);
    process.exit(1);
  }
};

// サーバー起動
startServer();