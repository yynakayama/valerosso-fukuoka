// server.js - Railway対応版
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // Railway用にデフォルト8080

// 基本ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ===== デバッグエンドポイント =====

// ルートページ
app.get('/', (req, res) => {
  res.send(`
    <h1>🎉 Railway 最小限デプロイ成功！</h1>
    <h2>🔧 デバッグツール</h2>
    <ul>
      <li><a href="/debug-env">環境変数確認</a></li>
      <li><a href="/test-db">DB接続テスト</a></li>
      <li><a href="/health">ヘルスチェック</a></li>
    </ul>
    <p>現在時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
  `);
});

// 環境変数確認
app.get('/debug-env', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    database: {
      url: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      host: process.env.DB_HOST || 'NOT_SET',
      port: process.env.DB_PORT || 'NOT_SET',
      user: process.env.DB_USER || 'NOT_SET',
      password: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
      database: process.env.DB_NAME || 'NOT_SET'
    },
    session: {
      secret: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET'
    },
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('MYSQL') || key.includes('DB') || key.includes('DATABASE')
    )
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// DB接続テスト（安全版）
app.get('/test-db', async (req, res) => {
  try {
    console.log('🔍 DB接続テスト開始（最小限版）');
    
    // まず環境変数をチェック
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL が設定されていません',
        timestamp: new Date().toISOString()
      });
    }
    
    // mysql2で直接接続テスト
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection(dbUrl + '?ssl={"rejectUnauthorized":false}');
    
    // 簡単なクエリ実行
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    res.json({
      success: true,
      message: '直接DB接続成功',
      result: rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ DB接続エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('サーバー内部エラー: ' + err.message);
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).send(`
    <h1>ページが見つかりません</h1>
    <p>URL: ${req.originalUrl}</p>
    <p><a href="/">ホームへ戻る</a></p>
  `);
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 最小限サーバー起動: ポート${PORT}`);
  console.log(`🌍 環境: ${process.env.NODE_ENV}`);
  console.log(`📅 起動時刻: ${new Date().toLocaleString('ja-JP')}`);
});

module.exports = app;