// server.js - メインサーバーファイル（詳細デバッグ版）
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
      console.log('🚀 マイグレーションを実行中...');
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
        timeout: 30000
      });
      
      if (stdout) console.log('📝 マイグレーション出力:', stdout);
      if (stderr && !stderr.includes('Nothing to migrate')) {
        console.warn('⚠️ マイグレーション警告:', stderr);
      }
      
      console.log('✅ マイグレーションが正常に完了しました');
      
    } catch (error) {
      console.error('❌ マイグレーション実行中にエラーが発生しました:', error.message);
      
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
    
    // 2. サーバー起動
    console.log('🚀 Expressサーバーを起動中...');
    
    // 設定ファイルとミドルウェアのインポート（エラーハンドリング付き）
    console.log('📦 設定ファイルを読み込み中...');
    let sessionConfig, securityMiddleware;
    
    try {
      sessionConfig = require('./config/session');
      console.log('✅ セッション設定読み込み成功');
    } catch (error) {
      console.error('❌ セッション設定読み込み失敗:', error.message);
      process.exit(1);
    }
    
    try {
      securityMiddleware = require('./config/security');
      console.log('✅ セキュリティ設定読み込み成功');
    } catch (error) {
      console.error('❌ セキュリティ設定読み込み失敗:', error.message);
      process.exit(1);
    }
    
    // ルーターのインポート（エラーハンドリング付き）
    console.log('🛣️ ルーターファイルを読み込み中...');
    let apiRoutes, adminRoutes, publicRoutes;
    
    try {
      apiRoutes = require('./routes/api');
      console.log('✅ API ルーター読み込み成功');
    } catch (error) {
      console.error('❌ API ルーター読み込み失敗:', error.message);
      console.error('詳細:', error);
      process.exit(1);
    }
    
    try {
      adminRoutes = require('./routes/admin');
      console.log('✅ 管理画面ルーター読み込み成功');
    } catch (error) {
      console.error('❌ 管理画面ルーター読み込み失敗:', error.message);
      console.error('詳細:', error);
      process.exit(1);
    }
    
    try {
      publicRoutes = require('./routes/public');
      console.log('✅ 公開ページルーター読み込み成功');
    } catch (error) {
      console.error('❌ 公開ページルーター読み込み失敗:', error.message);
      console.error('詳細:', error);
      process.exit(1);
    }
    
    // Expressアプリケーションの初期化
    const app = express();
    const PORT = process.env.PORT || 3000;
    console.log('🏗️ Express アプリケーション初期化完了');
    
    // 基本ミドルウェアの設定
    console.log('⚙️ ミドルウェアを設定中...');
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static('public'));
    console.log('✅ 基本ミドルウェア設定完了');
    
    // EJSをビューエンジンとして設定
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    console.log('✅ ビューエンジン設定完了');
    
    // セキュリティとログの設定
    console.log('🔒 セキュリティミドルウェアを設定中...');
    const { securityHeaders, requestLogger, userInfo } = securityMiddleware;
    app.use(securityHeaders);
    app.use(requestLogger);
    console.log('✅ セキュリティミドルウェア設定完了');
    
    // セッション設定の適用
    console.log('🍪 セッション設定を適用中...');
    app.use(sessionConfig);
    console.log('✅ セッション設定適用完了');
    
    // ユーザー情報設定の適用
    console.log('👤 ユーザー情報ミドルウェアを設定中...');
    app.use(userInfo);
    console.log('✅ ユーザー情報ミドルウェア設定完了');
    
    // テスト用エンドポイント（デバッグ用）
    app.get('/debug', (req, res) => {
      res.json({
        message: 'デバッグエンドポイント動作中',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        routes_loaded: {
          api: !!apiRoutes,
          admin: !!adminRoutes,
          public: !!publicRoutes
        }
      });
    });
    console.log('🔧 デバッグエンドポイント設定完了');
    
    // ルーティングの設定
    console.log('🛣️ ルーティングを設定中...');
    
    try {
      app.use('/api', apiRoutes);
      console.log('✅ API ルーティング設定完了');
    } catch (error) {
      console.error('❌ API ルーティング設定失敗:', error.message);
    }
    
    try {
      app.use('/admin', adminRoutes);
      console.log('✅ 管理画面ルーティング設定完了');
    } catch (error) {
      console.error('❌ 管理画面ルーティング設定失敗:', error.message);
    }
    
    try {
      app.use('/', publicRoutes);
      console.log('✅ 公開ページルーティング設定完了');
    } catch (error) {
      console.error('❌ 公開ページルーティング設定失敗:', error.message);
    }
    
    // エラーハンドリングミドルウェア
    app.use((err, req, res, next) => {
      console.error('🚨 サーバーエラー:', err);
      
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('不正なリクエストです');
      }
      
      res.status(500).send('サーバー内部エラーが発生しました');
    });
    
    // 404エラーハンドリング
    app.use((req, res) => {
      console.log('🔍 404エラー:', req.method, req.originalUrl);
      res.status(404).send(`ページが見つかりません: ${req.originalUrl}`);
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
      console.log('🔧 デバッグURL: /debug');
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