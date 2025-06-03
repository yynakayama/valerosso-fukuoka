// server.js - メインサーバーファイル（マイグレーション統合版）
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

// マイグレーション実行関数
const runMigrations = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 本番環境でマイグレーションを実行中...');
    
    try {
      // まずマイグレーション状態を確認
      console.log('📊 マイグレーション状態を確認中...');
      const { stdout: statusOutput } = await execAsync('npx sequelize-cli db:migrate:status');
      console.log('現在の状態:', statusOutput);
      
      // マイグレーション実行
      console.log('🚀 マイグレーションを実行中...');
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
      
      if (stdout) console.log('📝 マイグレーション出力:', stdout);
      if (stderr && !stderr.includes('Nothing to migrate')) {
        console.warn('⚠️ マイグレーション警告:', stderr);
      }
      
      console.log('✅ マイグレーションが正常に完了しました');
      
      // 完了後の状態確認
      const { stdout: finalStatus } = await execAsync('npx sequelize-cli db:migrate:status');
      console.log('📊 マイグレーション完了後の状態:', finalStatus);
      
    } catch (error) {
      console.error('❌ マイグレーション実行中にエラーが発生しました:', error.message);
      console.error('詳細:', error.stdout || error.stderr);
      
      // エラーでもサーバーは起動を続行（手動修正の機会を与える）
      console.log('⚠️ マイグレーションに失敗しましたが、サーバーは起動を続行します');
      console.log('📝 手動でマイグレーションを実行してください: npm run migrate');
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
    
    // 2. マイグレーション実行
    await runMigrations();
    
    // 3. サーバー起動
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
    
    // ヘルスチェックエンドポイント（詳細情報付き）
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          host: process.env.MYSQLHOST ? 'configured' : 'not_configured',
          port: process.env.MYSQLPORT || 'default'
        }
      });
    });
    
    // ルーティングの設定
    app.use('/api', apiRoutes);
    app.use('/admin', adminRoutes);
    app.use('/', publicRoutes);
    
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
    });
    
  } catch (error) {
    console.error('💀 サーバー起動中にエラーが発生しました:', error);
    process.exit(1);
  }
};

// サーバー起動
startServer();