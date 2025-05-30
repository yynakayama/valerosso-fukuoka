// server.js - Railway対応最終版
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
const util = require('util');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const execPromise = util.promisify(exec);

// 基本ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// EJSをビューエンジンとして設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== デバッグエンドポイント =====

// 環境変数確認エンドポイント
app.get('/debug-env', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST || 'NOT_SET',
      port: process.env.DB_PORT || 'NOT_SET',
      user: process.env.DB_USER || 'NOT_SET',
      password: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
      database: process.env.DB_NAME || 'NOT_SET'
    },
    session: {
      secret: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET'
    }
  });
});

// データベース接続テスト
app.get('/db-test', async (req, res) => {
  try {
    console.log('🔍 DB接続テスト開始');
    
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    
    // テーブル一覧取得
    const [tables] = await sequelize.query("SHOW TABLES");
    
    res.json({
      success: true,
      message: '接続成功',
      tables: tables.map(t => Object.values(t)[0]),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ DB接続エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.original?.code,
      errno: error.original?.errno,
      timestamp: new Date().toISOString()
    });
  }
});

// マイグレーション実行エンドポイント
app.get('/run-migration', async (req, res) => {
  try {
    console.log('🔄 マイグレーション実行開始');
    
    const { stdout, stderr } = await execPromise(
      'npx sequelize-cli db:migrate --env production'
    );
    
    console.log('✅ マイグレーション完了');
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);
    
    res.json({
      success: true,
      message: 'マイグレーション完了',
      stdout: stdout,
      stderr: stderr,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ マイグレーション失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// テーブル手動作成エンドポイント
app.get('/create-tables', async (req, res) => {
  try {
    console.log('🔧 テーブル手動作成開始');
    
    const { sequelize } = require('./models');
    
    // usersテーブル
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role ENUM('admin', 'editor') DEFAULT 'editor',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // newsテーブル
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        instagram_embed_code TEXT,
        author_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // inquiriesテーブル
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        inquiry_type ENUM('one-day-trial', 'join', 'media', 'other') NOT NULL,
        message TEXT,
        player_info JSON,
        media_info JSON,
        status ENUM('new', 'in-progress', 'completed', 'cancelled') DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // 管理者ユーザー作成
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sequelize.query(`
      INSERT IGNORE INTO users (username, password, full_name, role)
      VALUES ('admin', ?, 'システム管理者', 'admin')
    `, {
      replacements: [hashedPassword]
    });
    
    // サンプルニュース
    await sequelize.query(`
      INSERT IGNORE INTO news (id, title, content, author_id)
      VALUES 
      (1, '🎉 サイト公開', 'ヴァレロッソ福岡のサイトが公開されました', 1),
      (2, '⚽ 練習再開', '新学期の練習がスタートします', 1)
    `);
    
    res.json({
      success: true,
      message: 'テーブル作成完了',
      tables: ['users', 'news', 'inquiries'],
      adminLogin: { username: 'admin', password: 'admin123' },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ テーブル作成失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== ミドルウェア設定 =====

// セキュリティとログの設定（エラー回避）
try {
  const sessionConfig = require('./config/session');
  const { securityHeaders, requestLogger, userInfo } = require('./config/security');
  
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(sessionConfig);
  app.use(userInfo);
  
  console.log('✅ セキュリティ設定読み込み成功');
} catch (error) {
  console.warn('⚠️ セキュリティ設定読み込み失敗:', error.message);
  console.log('📝 基本設定で続行します');
  
  // 最小限のセッション設定
  const session = require('express-session');
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
}

// ===== ルーティング設定 =====

// API ルーティング
try {
  const apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes);
  console.log('✅ API routes loaded');
} catch (error) {
  console.warn('⚠️ API routes failed:', error.message);
  
  // 最小限のAPIルート
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API動作中', timestamp: new Date().toISOString() });
  });
}

// 管理画面ルーティング
try {
  const adminRoutes = require('./routes/admin');
  app.use('/admin', adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.warn('⚠️ Admin routes failed:', error.message);
  
  // 最小限の管理ルート
  app.get('/admin', (req, res) => {
    res.send('<h1>管理画面</h1><p>ルート読み込みエラー</p>');
  });
}

// 公開ページルーティング
try {
  const publicRoutes = require('./routes/public');
  app.use('/', publicRoutes);
  console.log('✅ Public routes loaded');
} catch (error) {
  console.warn('⚠️ Public routes failed:', error.message);
  
  // 最小限のルート
  app.get('/', (req, res) => {
    res.send(`
      <h1>🎉 Railway デプロイ成功！</h1>
      <h2>🔧 デバッグツール</h2>
      <ul>
        <li><a href="/debug-env">環境変数確認</a></li>
        <li><a href="/db-test">DB接続テスト</a></li>
        <li><a href="/create-tables">テーブル作成</a></li>
        <li><a href="/run-migration">マイグレーション実行</a></li>
        <li><a href="/api/test">API テスト</a></li>
      </ul>
      <h2>📱 アプリケーション</h2>
      <ul>
        <li><a href="/admin/login">管理画面ログイン</a></li>
      </ul>
    `);
  });
}

// ===== エラーハンドリング =====

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
  res.status(404).send(`
    <h1>ページが見つかりません</h1>
    <p><a href="/">ホームへ戻る</a></p>
  `);
});

// ===== サーバー起動 =====

// マイグレーション自動実行（本番環境のみ）
async function runStartupMigration() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 起動時マイグレーション実行中...');
      const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate --env production');
      console.log('✅ 起動時マイグレーション完了');
      if (stderr) console.log('Migration warnings:', stderr);
    } catch (error) {
      console.warn('⚠️ 起動時マイグレーション失敗:', error.message);
      console.log('📝 手動でマイグレーションを実行してください: /run-migration');
    }
  }
}

// サーバー起動
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 サーバー起動: ポート${PORT}`);
  console.log(`🌍 環境: ${process.env.NODE_ENV}`);
  console.log(`🔧 デバッグURL: http://localhost:${PORT}/debug-env`);
  console.log(`📱 管理画面: http://localhost:${PORT}/admin/login`);
  
  // 起動時マイグレーション実行
  await runStartupMigration();
});

// プロセス終了時の処理
process.on('SIGINT', async () => {
  console.log('🛑 サーバーを終了しています...');
  try {
    const { sequelize } = require('./models');
    await sequelize.close();
    console.log('✅ データベース接続を閉じました');
  } catch (error) {
    console.error('❌ データベース接続クローズ失敗:', error);
  }
  process.exit(0);
});

module.exports = app;