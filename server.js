// ============================================
// server.js の修正版（デバッグエンドポイント追加）
// ============================================

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

// ============================================
// 🔧 デバッグエンドポイント追加（ここから）
// ============================================

// シンプルなDB接続テスト
app.get('/db-test', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('=== DB接続テスト開始 ===');
    
    // 環境変数の確認
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('環境変数:', dbConfig);
    
    // Sequelize接続テスト
    const { sequelize } = require('./models');
    
    console.log('Sequelize接続テスト中...');
    await sequelize.authenticate();
    console.log('✅ データベース接続成功');
    
    // テーブル確認
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('テーブル一覧:', tables);
    
    // Newsモデルテスト
    let newsResult = { exists: false, count: 0, error: null };
    try {
      const { News } = require('./models');
      const count = await News.count();
      const sample = await News.findAll({ limit: 2 });
      newsResult = {
        exists: true,
        count: count,
        sample: sample.map(n => ({ id: n.id, title: n.title }))
      };
    } catch (error) {
      newsResult.error = error.message;
    }
    
    // 成功レスポンス
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        config: dbConfig,
        connection: 'success',
        tables: tables.map(t => Object.values(t)[0])
      },
      news: newsResult
    };
    
    console.log('レスポンス:', JSON.stringify(response, null, 2));
    res.json(response);
    
  } catch (error) {
    console.error('❌ DB接続エラー:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
    
    res.status(500).json(errorResponse);
  }
});

// テーブル作成エンドポイント
app.get('/create-tables', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('=== テーブル作成開始 ===');
    
    const { sequelize } = require('./models');
    
    // 手動でテーブル作成
    console.log('usersテーブル作成中...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role ENUM('admin', 'editor') DEFAULT 'editor',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('newsテーブル作成中...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        instagram_embed_code TEXT,
        author_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('inquiriesテーブル作成中...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // 管理者ユーザー作成
    console.log('管理者ユーザー作成中...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sequelize.query(`
      INSERT IGNORE INTO users (username, password, full_name, role)
      VALUES ('admin', ?, 'システム管理者', 'admin')
    `, {
      replacements: [hashedPassword]
    });
    
    // サンプルニュース作成
    console.log('サンプルニュース作成中...');
    await sequelize.query(`
      INSERT IGNORE INTO news (id, title, content, author_id)
      VALUES 
      (1, '🎉 ウェブサイト公開', 'ヴァレロッソ福岡の公式ウェブサイトが正式に公開されました！', 1),
      (2, '⚽ 練習再開のお知らせ', '新学期に向けて練習がスタートします。', 1),
      (3, '📸 フォトギャラリー更新', '最新の写真をアップロードしました。', 1)
    `);
    
    // 確認
    const [newsCount] = await sequelize.query('SELECT COUNT(*) as count FROM news');
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    
    const response = {
      success: true,
      message: 'テーブル作成完了',
      results: {
        tablesCreated: ['users', 'news', 'inquiries'],
        newsCount: newsCount[0].count,
        userCount: userCount[0].count,
        adminCredentials: 'admin / admin123'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('作成完了:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ テーブル作成エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 🔧 デバッグエンドポイント追加（ここまで）
// ============================================

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